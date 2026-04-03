"use client";
import React from "react";
import { Element } from "react-scroll";

const FeedbackForm = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = React.useState(false);
  const [errors, setErrors] = React.useState({
    name: "",
    email: "",
    phoneNumber: "",
    message: "",
  });

  const validateForm = (formData: any) => {
    const newErrors = { name: "", email: "", phoneNumber: "", message: "" };
    let isValid = true;

    if (!formData.get("name") || formData.get("name").length < 2) {
      newErrors.name = "نام باید حداقل ۲ کاراکتر باشد.";
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.get("email") || !emailRegex.test(formData.get("email"))) {
      newErrors.email = "آدرس ایمیل نامعتبر است.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (!validateForm(formData)) return;

    try {
      setIsSubmitting(true);
      setIsSubmitSuccessful(false);

      const response = await fetch(`/api/quote`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `خطا در ارسال فرم: ${response.status} ${response.statusText}`
        );
      }

      e.target.reset();
      setIsSubmitting(false);
      setIsSubmitSuccessful(true);
      setErrors({ name: "", email: "", phoneNumber: "", message: "" });
    } catch (error) {
      console.error("خطا در ارسال فرم:", error);
      setIsSubmitting(false);
      setIsSubmitSuccessful(false);
    }
  };

  return (
    <Element name="quoteForm">
      <section
        className="bg-blue-200 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans"
        aria-labelledby="feedback-form-heading"
      >
        <div className="w-full max-w-6xl p-6 sm:p-8 lg:p-8 rounded-lg">
          <h2
            id="feedback-form-heading"
            className=" text-3xl sm:text-4xl font-bold mb-8 text-right"
          >
            ارسال نظرات و پیشنهادات
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Right Section: Text Content */}
            <div className=" space-y-6 text-right">
              <p className="text-lg leading-relaxed">
                نظرات شما برای ما ارزشمند است! برنامه جانارام با هدف ارائه
                تجربه‌ای آرامش‌بخش و متمرکز بر مدیتیشن طراحی شده است. ما در
                تلاشیم تا با ارائه محتوای باکیفیت، به شما کمک کنیم تا آرامش و
                تعادل را در زندگی روزمره خود تجربه کنید
              </p>
              <p className="text-lg leading-relaxed">
                اگر پیشنهادی برای بهبود برنامه دارید یا می‌خواهید تجربه خود را
                با ما به اشتراک بگذارید، لطفاً فرم زیر را پر کنید. نظرات شما به
                ما کمک می‌کند تا خدمات بهتری ارائه دهیم و جانارام را به انتخاب
                اول شما برای . مدیتیشن تبدیل کنیم
              </p>
              {/* <p className="text-lg leading-relaxed">
              برای ارتباط مستقیم با تیم جانارام، می‌توانید با شماره <span className="text-green-300">۰۲۱-۱۲۳۴۵۶۷۸</span>{" "}
              تماس بگیرید یا از طریق فرم زیر با ما در ارتباط باشید.
            </p> */}
            </div>

            {/* Left Section: Form */}
            <div className="p-0">
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                role="form"
                aria-labelledby="feedback-form-heading"
              >
                {/* Name and Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="text-black block text-sm font-medium text-right"
                    >
                      نام
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="نام شما"
                      className="mt-1 w-full text-black placeholder-gray-500 bg-white rounded-md p-2 focus:ring-blue-400 focus:border-blue-400 text-right"
                      aria-required="true"
                    />
                    {errors.name && (
                      <p className="text-red-300 text-sm mt-1 text-right">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="text-black block text-sm font-medium text-right"
                    >
                      شماره تلفن
                    </label>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="text"
                      placeholder="شماره تلفن شما"
                      className="mt-1 w-full text-black placeholder-gray-500 bg-white rounded-md p-2 focus:ring-blue-400 focus:border-blue-400 text-right"
                      aria-required="false"
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-300 text-sm mt-1 text-right">
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-black block text-sm font-medium text-right"
                  >
                    آدرس ایمیل
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ایمیل شما"
                    className="mt-1 w-full text-black placeholder-gray-500 bg-white rounded-md p-2 focus:ring-blue-400 focus:border-blue-400 text-right"
                    aria-required="true"
                  />
                  {errors.email && (
                    <p className="text-red-300 text-sm mt-1 text-right">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="text-black block text-sm font-medium text-right"
                  >
                    نظرات و پیشنهادات
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="نظرات و پیشنهادات شما"
                    className="mt-1 w-full text-black placeholder-gray-500 bg-white rounded-md p-2 focus:ring-blue-400 focus:border-blue-400 min-h-[120px] text-right"
                    aria-required="false"
                  />
                  {errors.message && (
                    <p className="text-red-300 text-sm mt-1 text-right">
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full text-white bg-black hover:bg-white hover:text-black  rounded-md py-3 font-semibold text-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "در حال ارسال..." : "ارسال نظر"}
                </button>
                {isSubmitSuccessful && (
                  <p className="text-green-900 text-sm mt-2 text-right">
                    نظرات شما با موفقیت ارسال شد! 🎉
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </Element>
  );
};
export default FeedbackForm;
