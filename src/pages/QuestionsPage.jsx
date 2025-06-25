// src/pages/QuestionsPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaLightbulb,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext"; // <--- IMPORT useAuth hook

// ⭐ REMOVED currentUser prop from here, it will be consumed from context
const QuestionsPage = () => {
  // ⭐ UPDATED: Get currentUser and loadingUser from context
  const { currentUser, loadingUser } = useAuth();

  const { articleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [articleTitle, setArticleTitle] = useState("News Article");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const formatSourceForBackend = (source, type) => {
    if (!source) return "";
    const lowerSource = source.toLowerCase();

    const sourceMap = {
      "the hindu": { configKey: "hindu", modelName: "TheHindu" },
      hindu: { configKey: "hindu", modelName: "TheHindu" },
      "dna india": { configKey: "dna", modelName: "DNA" },
      dna: { configKey: "dna", modelName: "DNA" },
      "hindustan times": {
        configKey: "hindustan-times",
        modelName: "HindustanTimes",
      },
      "hindustan-times": {
        configKey: "hindustan-times",
        modelName: "HindustanTimes",
      },
      "times of india": { configKey: "toi", modelName: "TimesOfIndia" },
      toi: { configKey: "toi", modelName: "TimesOfIndia" },
      "indian express": { configKey: "ie", modelName: "IndianExpress" },
      ie: { configKey: "ie", modelName: "IndianExpress" },
    };

    const entry = sourceMap[lowerSource];

    if (entry) {
      return type === "configKey" ? entry.configKey : entry.modelName;
    }

    console.warn(
      `[formatSourceForBackend] No direct map for '${source}'. Falling back.`
    );
    if (type === "configKey") {
      return lowerSource.replace(/ /g, "-");
    } else if (type === "modelName") {
      return lowerSource
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
    }
    return lowerSource;
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      setQuestions([]);

      // ⭐ AUTHENTICATION LOGIC: Check loadingUser first, then currentUser ⭐
      // If Firebase auth state is still loading, return and let AuthProvider handle the UI
      if (loadingUser) {
        setLoading(true); // Keep loading state true while waiting
        return;
      }

      // If loading is complete and no user is found, redirect to login
      if (!currentUser) {
        toast.error("Please log in to view questions.");
        navigate("/login");
        setLoading(false);
        return;
      }

      let token = null;
      try {
        token = await currentUser.getIdToken();
      } catch (tokenError) {
        console.error("Error getting Firebase ID token:", tokenError);
        toast.error("Failed to get authentication token. Please re-login.");
        navigate("/login");
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };
      // --- END AUTHENTICATION LOGIC ---

      const params = new URLSearchParams(location.search);
      const sourceFromUrlRaw = params.get("source");
      const titleFromUrl = params.get("title");

      if (titleFromUrl) {
        setArticleTitle(decodeURIComponent(titleFromUrl));
      }

      const sourceKeyForAPI = formatSourceForBackend(
        sourceFromUrlRaw,
        "configKey"
      );

      if (!articleId || !sourceKeyForAPI) {
        setError("Missing article ID or source to fetch questions.");
        setLoading(false);
        toast.error("Cannot load questions: Missing article ID or source.");
        return;
      }

      try {
        const url = `${process.env.REACT_APP_BACKEND_URI}api/questions/get-by-article/${sourceKeyForAPI}/${articleId}`;
        console.log(
          `[QuestionsPage] Attempting to fetch questions from: ${url}`
        );

        const response = await axios.get(url, { headers: headers });

        if (
          response.data &&
          Array.isArray(response.data.questions) &&
          response.data.questions.length > 0
        ) {
          setQuestions(response.data.questions);
          toast.success(
            response.data.message || "Questions loaded successfully!"
          );
        } else {
          setError(
            response.data.message || "No questions found for this article."
          );
          toast.warn(response.data.message || "No questions found.");
        }
      } catch (err) {
        console.error(
          "Failed to fetch questions:",
          err.response ? err.response.data : err.message
        );
        let errorMessage =
          err.response?.data?.message ||
          "Failed to load questions. Please try again.";

        if (err.response && err.response.status === 401) {
          errorMessage = "Unauthorized: Please log in again to view questions.";
          navigate("/login");
        }

        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();

    // Reset quiz state on re-fetch (e.g., if articleId changes)
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowCorrectAnswer(false);
    setScore(0);
    setQuizCompleted(false);
    setShowHint(false);
  }, [articleId, location.search, currentUser, navigate, loadingUser]); // ⭐ Added loadingUser to dependencies

  const handleOptionSelect = (option) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(option);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
      toast.success("Correct Answer!");
    } else {
      toast.error("Incorrect Answer.");
    }
    setShowCorrectAnswer(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setShowCorrectAnswer(false);
      setShowHint(false);
    } else {
      setQuizCompleted(true);
      toast.info("Quiz Completed! Check your final score.");
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowCorrectAnswer(false);
    setScore(0);
    setQuizCompleted(false);
    setShowHint(false);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto p-4 bg-app-bg-primary text-app-text-primary min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-5 py-2 bg-app-bg-secondary text-app-text-primary rounded-lg hover:bg-app-gray-border transition-colors duration-200 flex items-center"
      >
        &larr; Back to News
      </button>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-app-blue-main mb-6 text-center">
        Questions for: "{articleTitle}"
      </h1>

      {loading && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
          <FaSpinner className="animate-spin text-app-blue-main text-5xl mb-4" />
          <p className="ml-3 text-xl font-medium text-app-text-primary">
            Loading questions...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] text-red-500 text-lg text-center p-4">
          <FaTimesCircle className="text-6xl mb-4" />
          <p className="text-xl font-medium mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-220"
          >
            Go Back
          </button>
        </div>
      )}

      {!loading && !error && questions.length === 0 && (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] text-app-text-primary text-lg text-center p-4">
          <p className="mb-4 text-xl font-medium">
            No questions could be generated for this article at the moment.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      )}

      {!loading && !error && questions.length > 0 && (
        <>
          {!quizCompleted ? (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6 px-2">
                <p className="text-app-text-secondary text-lg font-medium">
                  Question {currentQuestionIndex + 1} / {questions.length}
                </p>
                <p className="text-xl font-bold text-app-text-primary">
                  Score: {score} /{" "}
                  {currentQuestionIndex + (selectedAnswer !== null ? 1 : 0)}
                </p>
              </div>

              <div className="bg-app-bg-secondary p-6 rounded-xl shadow-2xl border border-app-gray-border">
                <p className="font-semibold text-2xl text-app-text-primary mb-6 leading-relaxed">
                  {currentQuestion.question}
                </p>

                <div className="space-y-4">
                  {currentQuestion.options &&
                    currentQuestion.options.map((option, optIndex) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrectOption =
                        option === currentQuestion.correctAnswer;
                      const showFeedback = selectedAnswer !== null;

                      let optionClasses =
                        "p-4 rounded-lg cursor-pointer transition-all duration-300 ease-in-out flex items-center justify-between font-medium text-lg";

                      if (showFeedback) {
                        if (isCorrectOption) {
                          optionClasses +=
                            " bg-app-green-feedback text-white border-2 border-green-500";
                        } else if (isSelected && !isCorrectOption) {
                          optionClasses +=
                            " bg-app-red-feedback text-white border-2 border-red-500";
                        } else {
                          optionClasses +=
                            " bg-app-bg-secondary text-app-text-primary border border-app-gray-border";
                        }
                      } else {
                        optionClasses +=
                          " bg-app-bg-secondary text-app-text-primary hover:bg-app-gray-border border border-app-gray-border";
                      }

                      return (
                        <div
                          key={optIndex}
                          className={optionClasses}
                          onClick={() => handleOptionSelect(option)}
                        >
                          <span>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </span>{" "}
                          {showFeedback && (
                            <span className="ml-auto text-2xl">
                              {isCorrectOption ? (
                                <FaCheckCircle className="text-green-300" />
                              ) : (
                                isSelected && (
                                  <FaTimesCircle className="text-red-300" />
                                )
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>

                {showCorrectAnswer &&
                  selectedAnswer !== currentQuestion.correctAnswer && (
                    <p className="mt-6 text-md text-app-yellow-feedback font-semibold text-center bg-app-bg-secondary p-3 rounded">
                      Correct Answer:{" "}
                      <span className="text-green-300">
                        {currentQuestion.correctAnswer}
                      </span>
                    </p>
                  )}

                {currentQuestion.hint && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={toggleHint}
                      className="px-4 py-2 bg-app-purple-button text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center mx-auto"
                    >
                      <FaLightbulb className="mr-2" />
                      {showHint ? "Hide Hint" : "Show Hint"}
                    </button>
                    {showHint && (
                      <p className="mt-3 text-sm text-app-text-secondary italic p-3 bg-app-bg-secondary rounded-lg">
                        Hint: {currentQuestion.hint}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                  className={`py-3 px-8 rounded-lg font-bold text-xl transition-colors duration-200
                                ${
                                  selectedAnswer === null
                                    ? "bg-blue-300 text-blue-800 cursor-not-allowed"
                                    : "bg-app-blue-main text-white hover:bg-blue-700"
                                }`}
                >
                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-app-bg-secondary rounded-xl shadow-2xl border border-app-gray-border max-w-2xl mx-auto">
              <h4 className="text-5xl font-extrabold text-app-green-feedback mb-8">
                Quiz Completed! 🎉
              </h4>
              <p className="text-3xl text-app-text-primary mb-10">
                Your final score:{" "}
                <span className="text-green-300">{score}</span> out of{" "}
                <span className="text-app-blue-light">{questions.length}</span>
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleRestartQuiz}
                  className="bg-app-blue-main text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="bg-red-600 text-white py-3 px-8 rounded-lg hover:bg-red-700 transition-colors duration-200 text-lg font-semibold"
                >
                  Back to News
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionsPage;
