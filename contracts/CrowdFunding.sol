// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CrowdFunding {
    enum CampaignState {
        Active,
        Successful,
        Failed
    }

    struct Campaign {
        address payable owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address[] donators;
        uint256[] donations;
        bool claimed;
        CampaignState state;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public fundsByDonator;

    uint256 public numberOfCampaigns = 0;

    // Events for better frontend integration and transparency
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed owner,
        string title,
        uint256 target,
        uint256 deadline
    );
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donator,
        uint256 amount
    );
    event FundsClaimed(
        uint256 indexed campaignId,
        address indexed owner,
        uint256 amount
    );
    event RefundIssued(
        uint256 indexed campaignId,
        address indexed donator,
        uint256 amount
    );
    event CampaignStateChanged(
        uint256 indexed campaignId,
        CampaignState newState
    );

    modifier campaignExists(uint256 _id) {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        _;
    }

    modifier onlyCampaignOwner(uint256 _id) {
        require(
            campaigns[_id].owner == msg.sender,
            "Only campaign owner can perform this action"
        );
        _;
    }

    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) public returns (uint256) {
        // Ensure the campaign deadline is in the future
        require(
            _deadline > block.timestamp,
            "The deadline should be a date in the future."
        );

        // Owner address should be valid and payable
        require(_owner != address(0), "Invalid owner address");

        uint256 campaignId = numberOfCampaigns;
        Campaign storage campaign = campaigns[campaignId];

        campaign.owner = payable(_owner);
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.image = _image;
        campaign.claimed = false;
        campaign.state = CampaignState.Active;

        numberOfCampaigns++;

        emit CampaignCreated(campaignId, _owner, _title, _target, _deadline);

        return campaignId;
    }

    function donateToCampaign(uint256 _id) public payable campaignExists(_id) {
        Campaign storage campaign = campaigns[_id];

        // Validate campaign is still active
        require(
            campaign.state == CampaignState.Active,
            "Campaign is no longer active"
        );
        require(
            block.timestamp < campaign.deadline,
            "Campaign deadline has passed"
        );
        require(msg.value > 0, "Donation amount must be greater than 0");

        campaign.donators.push(msg.sender);
        campaign.donations.push(msg.value);

        // Keep track of individual donations for potential refunds
        fundsByDonator[_id][msg.sender] += msg.value;

        // Update the amount collected
        campaign.amountCollected += msg.value;

        // Check if target has been reached
        if (campaign.amountCollected >= campaign.target) {
            campaign.state = CampaignState.Successful;
            emit CampaignStateChanged(_id, CampaignState.Successful);
        }

        emit DonationReceived(_id, msg.sender, msg.value);
    }

    function claimFunds(
        uint256 _id
    ) public campaignExists(_id) onlyCampaignOwner(_id) {
        Campaign storage campaign = campaigns[_id];

        require(!campaign.claimed, "Funds have already been claimed");
        require(
            campaign.state == CampaignState.Successful ||
                (block.timestamp > campaign.deadline &&
                    campaign.amountCollected > 0),
            "Cannot claim funds yet"
        );

        // If deadline passed but target not met, change state to Failed
        if (
            block.timestamp > campaign.deadline &&
            campaign.amountCollected < campaign.target
        ) {
            campaign.state = CampaignState.Failed;
            emit CampaignStateChanged(_id, CampaignState.Failed);
            revert("Campaign failed to reach target, donors can claim refunds");
        }

        uint256 amountToTransfer = campaign.amountCollected;
        campaign.claimed = true;

        // Transfer funds to campaign owner
        (bool success, ) = campaign.owner.call{value: amountToTransfer}("");
        require(success, "Transfer to campaign owner failed");

        emit FundsClaimed(_id, campaign.owner, amountToTransfer);
    }

    function claimRefund(uint256 _id) public campaignExists(_id) {
        // First check if user has donated anything
        uint256 amount = fundsByDonator[_id][msg.sender];
        require(
            amount > 0,
            "You have not donated to this campaign or already claimed your refund"
        );

        Campaign storage campaign = campaigns[_id];

        // Then check if campaign is eligible for refunds
        require(
            block.timestamp > campaign.deadline &&
                campaign.amountCollected < campaign.target,
            "Refunds only available for failed campaigns"
        );

        // Update state if needed
        if (campaign.state != CampaignState.Failed) {
            campaign.state = CampaignState.Failed;
            emit CampaignStateChanged(_id, CampaignState.Failed);
        }

        // Reset refund amount before transfer to prevent reentrancy
        fundsByDonator[_id][msg.sender] = 0;

        // Decrease the campaign's amountCollected
        campaign.amountCollected -= amount;

        // Send refund
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(_id, msg.sender, amount);
    }

    function updateCampaignState(uint256 _id) public campaignExists(_id) {
        Campaign storage campaign = campaigns[_id];

        // Skip if already finalized
        if (campaign.state != CampaignState.Active) {
            return;
        }

        // If deadline has passed
        if (block.timestamp > campaign.deadline) {
            if (campaign.amountCollected >= campaign.target) {
                campaign.state = CampaignState.Successful;
            } else {
                campaign.state = CampaignState.Failed;
            }
            emit CampaignStateChanged(_id, campaign.state);
        }
    }

    function getDonators(
        uint256 _id
    )
        public
        view
        campaignExists(_id)
        returns (address[] memory, uint256[] memory)
    {
        return (campaigns[_id].donators, campaigns[_id].donations);
    }

    function getCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for (uint256 i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];
            allCampaigns[i] = item;
        }

        return allCampaigns;
    }

    function getCampaign(
        uint256 _id
    ) public view campaignExists(_id) returns (Campaign memory) {
        return campaigns[_id];
    }
}
