"use client";

import React from "react";

const CustomButton = ({
  btnType = "button",
  title = "Click",
  handleClick,
  styles = "",
  disabled = false,
}) => {
  return (
    <button
      type={btnType}
      disabled={disabled}
      className={`font-epilogue font-semibold text-[16px] leading-[26px] text-white min-h-[52px] px-4 rounded-[10px] hover:bg-opacity-80 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed ${styles}`}
      onClick={handleClick}
    >
      {title}
    </button>
  );
};

export default CustomButton;
