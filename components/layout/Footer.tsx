import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold text-right mb-4">جانارام</h3>
            <p className="text-sm text-right">
              آرامش خود را در هر زمان پیدا کنید. یک اپلیکیشن مدیتیشن موبایل که به بازگرداندن تعادل، کاهش استرس و بهبود
              سلامت روان کمک می‌کند.
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold mb-4">لینک‌ها</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="hover:text-gray-300">
                  نظرات{" "}
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-gray-300">
                  سوالات متداول
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-gray-300">
                  تماس با ما
                </a>
              </li>
            </ul>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold mb-4">تماس با ما</h3>
            <p className="text-sm"> info@janaram.ir : ایمیل</p>
            {/* <p className="text-sm">تلفن: +1-234-567-890</p> */}
            {/* <div className="mt-4">
              <a href="#" className="text-gray-300 hover:text-white mr-4">
                فیسبوک
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                توییتر
              </a>
            </div> */}
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} جانارام. کلیه حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
