"use client";

import { useEffect } from "react";
import { scroller } from "react-scroll";

export default function ScrollToHash() {
  useEffect(() => {
    if (window.location.hash === "#downloadSection") {
      scroller.scrollTo("downloadSection", {
        duration: 500,
        delay: 0,
        smooth: "easeInOutQuart",
        offset: -100, // adjust if header overlaps
      });
    }
  }, []);

  return null; // this component just runs the effect
}
