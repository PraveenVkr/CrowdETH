"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStateContext } from "../../context/StateContext";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";
import Loader from "../../components/Loader";

import { checkIfImage } from "../../utils/index";

const CreateCampaign = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const { publishCampaign } = useStateContext(); // Changed from createCampaign to publishCampaign
  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
  });

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
    setFormError(""); // Clear error when user starts typing
  };

  const validateForm = () => {
    // Check if all required fields are filled
    for (const [key, value] of Object.entries(form)) {
      if (!value.trim()) {
        setFormError(`Please fill in the ${key} field`);
        return false;
      }
    }

    // Validate target (should be a valid number)
    if (isNaN(parseFloat(form.target)) || parseFloat(form.target) <= 0) {
      setFormError("Please enter a valid positive number for the goal");
      return false;
    }

    // Validate deadline (should be in the future)
    const deadlineDate = new Date(form.deadline);
    if (deadlineDate <= new Date()) {
      setFormError("Deadline should be a future date");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    checkIfImage(form.image, async (exists) => {
      if (exists) {
        try {
          setIsLoading(true);

          // Direct call to publishCampaign without parsing the target here
          // as this is already done in the publishCampaign function
          await publishCampaign(form);

          setIsLoading(false);
          router.push("/");
        } catch (error) {
          console.error("Campaign creation error:", error);
          setFormError(
            `Failed to create campaign: ${error.message || "Please try again."}`
          );
          setIsLoading(false);
        }
      } else {
        setFormError("Please provide a valid image URL");
        setForm({ ...form, image: "" });
      }
    });
  };

  return (
    <div className="bg-[#2a2a34] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      {isLoading && <Loader />}
      <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#4a4a53] rounded-[10px]">
        <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">
          Start a Campaign
        </h1>
      </div>

      {formError && (
        <div className="mt-5 w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {formError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full mt-[65px] flex flex-col gap-[30px]"
      >
        <div className="flex flex-wrap gap-[40px]">
          <FormField
            labelName="Your Name *"
            placeholder="John Doe"
            inputType="text"
            value={form.name}
            handleChange={(e) => handleFormFieldChange("name", e)}
          />
          <FormField
            labelName="Campaign Title *"
            placeholder="Write a title"
            inputType="text"
            value={form.title}
            handleChange={(e) => handleFormFieldChange("title", e)}
          />
        </div>
        <FormField
          labelName="Story *"
          placeholder="Write your story"
          isTextArea
          value={form.description}
          handleChange={(e) => handleFormFieldChange("description", e)}
        />
        <div className="w-full flex justify-start items-center p-4 bg-[#8c6dfd] h-[120px] rounded-[10px]">
          <Image
            src="/money.svg"
            alt="money"
            width={40}
            height={40}
            className="object-contain"
          />
          <h4 className="font-epilogue font-bold text-[25px] text-white ml-[20px]">
            You will get 100% of the raised amount
          </h4>
        </div>
        <div className="flex flex-wrap gap-[40px]">
          <FormField
            labelName="Goal *"
            placeholder="ETH 0.50"
            inputType="text"
            value={form.target}
            handleChange={(e) => handleFormFieldChange("target", e)}
          />
          <FormField
            labelName="End Date *"
            placeholder="End Date"
            inputType="date"
            value={form.deadline}
            handleChange={(e) => handleFormFieldChange("deadline", e)}
          />
        </div>
        <FormField
          labelName="Campaign image *"
          placeholder="Place image URL of your campaign"
          inputType="url"
          value={form.image}
          handleChange={(e) => handleFormFieldChange("image", e)}
        />
        <div className="flex justify-center items-center mt-[40px]">
          <CustomButton
            btnType="submit"
            title="Submit new campaign"
            styles="bg-[#1dc071]"
          />
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
