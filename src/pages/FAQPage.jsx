// src/pages/FAQPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function FAQPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back one step in the history
  };

  return (
    // Updated main container background and text
    <div className="flex-1 flex flex-col items-center justify-center bg-app-bg-primary text-app-text-primary p-6">
      {/* Updated card background and text */}
      <div className="bg-app-bg-secondary p-8 rounded-lg shadow-xl max-w-lg w-full text-left relative">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          // Updated button colors
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-app-bg-secondary text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-blue-main"
          aria-label="Go back"
          title="Go back"
        >
          <FaArrowLeft className="text-2xl" />
        </button>

        {/* Updated title color */}
        <h2 className="text-4xl font-bold text-app-blue-main mb-6 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div>
            {/* Updated heading color */}
            <h3 className="text-2xl font-semibold text-app-blue-main mb-2">
              Q: How do I bookmark an article?
            </h3>
            {/* Updated paragraph text color */}
            <p className="text-lg text-app-text-secondary">
              A: You can bookmark an article by clicking the bookmark icon
              (usually a ribbon or star) on each news card.
            </p>
          </div>

          <div>
            {/* Updated heading color */}
            <h3 className="text-2xl font-semibold text-app-blue-main mb-2">
              Q: How can I change my theme?
            </h3>
            {/* Updated paragraph text color */}
            <p className="text-lg text-app-text-secondary">
              A: Navigate to the "Settings & Help" page from the sidebar and use
              the "Theme Preference" toggle to switch between dark and light
              modes.
            </p>
          </div>

          <div>
            {/* Updated heading color */}
            <h3 className="text-2xl font-semibold text-app-blue-main mb-2">
              Q: Why are some articles missing?
            </h3>
            {/* Updated paragraph text color */}
            <p className="text-lg text-app-text-secondary">
              A: We aggregate news from various sources. If an article is
              missing, it might be due to API limitations, source availability,
              or recent publication.
            </p>
          </div>

          {/* Add more FAQ items as needed */}
          {/* Updated paragraph text color */}
          <p className="text-md text-app-text-secondary text-center pt-4">
            Still have questions? Contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
