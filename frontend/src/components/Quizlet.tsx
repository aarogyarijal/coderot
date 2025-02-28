import { useState, useEffect } from "react";
import "./styles.css";
import { FaCheckCircle } from "react-icons/fa";

type Tags = {
  difficulty: string;
  skillArea: string;
  language: string;
  concepts: string[];
};

type Question = {
  id: number;
  question: string;
  options: string[];
  correct: string;
  feedback: string;
  totalAttempts: number;
  correctAttempts: number;
  tags: Tags;
};

function Quizlet() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [showSubmit, setShowSubmit] = useState(true);
  const [showNext, setShowNext] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedSkillArea, setSelectedSkillArea] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/questions")
      .then((response) => response.json())
      .then((data) => {
        setQuestions(data);
        setFilteredQuestions(data);
      })
      .catch((error) =>
        console.error("Failed fetching questions from API:/n", error)
      );
  }, []);

  useEffect(() => {
    filterQuestions(selectedLanguage, selectedSkillArea);
    console.log("FILTERED: ", filteredQuestions);
  }, [selectedLanguage, selectedSkillArea]);

  // Get unique values for language and skillArea
  const getUniqueValues = (key: keyof Tags) => {
    return Array.from(new Set(questions.map((q) => q.tags[key])));
  };

  const uniqueLanguages = getUniqueValues("language");
  const uniqueSkillAreas = getUniqueValues("skillArea");

  // Filter languages based on skill area selection
  const filteredLanguages = selectedSkillArea
    ? uniqueLanguages.filter((lang) =>
        questions.some(
          (q) =>
            q.tags.language === lang && q.tags.skillArea === selectedSkillArea
        )
      )
    : uniqueLanguages;

  // Filter skill areas based on language selection
  const filteredSkillAreas = selectedLanguage
    ? uniqueSkillAreas.filter((skill) =>
        questions.some(
          (q) =>
            q.tags.skillArea === skill && q.tags.language === selectedLanguage
        )
      )
    : uniqueSkillAreas;

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedLang = event.target.value;
    setSelectedLanguage(selectedLang);
    filterQuestions(selectedLang, selectedSkillArea);
  };

  const handleSkillAreaChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedSkill = event.target.value;
    setSelectedSkillArea(selectedSkill);
    filterQuestions(selectedLanguage, selectedSkill);
  };

  const filterQuestions = (language: string, skillArea: string) => {
    let filtered = questions;

    if (language) {
      filtered = filtered.filter((q) => q.tags.language === language);
    }
    if (skillArea) {
      filtered = filtered.filter((q) => q.tags.skillArea === skillArea);
    }

    setFilteredQuestions(filtered);
    setCurrentQuestion(0); // Reset to first question when filters change

    // Update the skillArea dropdown based on selected language
    if (language) {
      const validSkillAreas = Array.from(
        new Set(filtered.map((q) => q.tags.skillArea))
      );
      setSelectedSkillArea((prev) =>
        validSkillAreas.includes(prev) ? prev : validSkillAreas[0] || ""
      );
    }

    // Update the language dropdown based on selected skill area
    if (skillArea) {
      const validLanguages = Array.from(
        new Set(filtered.map((q) => q.tags.language))
      );
      setSelectedLanguage((prev) =>
        validLanguages.includes(prev) ? prev : validLanguages[0] || ""
      );
    }
  };

  function handleSubmit(): void {
    if (selectedOption == "") {
      setFeedback("Select an Option!");
      return;
    }
    console.log("Submitting!");
    fetch("http://localhost:5000/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionID: filteredQuestions[currentQuestion].id,
        answer: selectedOption,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setQuestions((prevQuestions) =>
          prevQuestions.map((q) =>
            q.id === filteredQuestions[currentQuestion].id
              ? {
                  ...q,
                  totalAttempts: data.totalAttempts,
                  correctAttempts: data.correctAttempts,
                }
              : q
          )
        );
        setFilteredQuestions((prevQuestions) =>
          prevQuestions.map((q) =>
            q.id === filteredQuestions[currentQuestion].id
              ? {
                  ...q,
                  totalAttempts: data.totalAttempts,
                  correctAttempts: data.correctAttempts,
                }
              : q
          )
        );

        if (data.correct) {
          setFeedback("Correct!");
        } else {
          setFeedback(data.feedback);
        }
        setShowNext(true);
        setShowSubmit(false);
      })
      .catch((error) => {
        console.error("Failed checking answer:\n", error);
        setFeedback("Internal Server Error! Try Again.");
      });
  }

  function handleNextQuestion(): void {
    setSelectedOption("");
    setFeedback("");
    setCurrentQuestion((prev) => (prev + 1) % filteredQuestions.length);
    setShowNext(false);
    setShowSubmit(true);
  }

  function handleOptionClick(option: string): void {
    if (showSubmit) setSelectedOption(option);
    else {
      setFeedback("Click below to go to the next question!");
    }
  }

  function getSuccessRateColor(
    correctAttempts: number,
    totalAttempts: number
  ): string {
    if (totalAttempts === 0) return "gray"; // Default color when no attempts

    const successRate = (correctAttempts * 100) / totalAttempts;

    if (successRate < 40) return "#ff7f7f"; // Low success rate (Red)
    if (successRate < 70) return "gold"; // Medium success rate (Orange/Yellow)
    return "#d1ffbd"; // High success rate (Green)
  }

  function getDifficultyColor(difficulty: string): string {
    if (!difficulty) return ""; // Default color when no attempts

    if (difficulty === "Hard") return "#ff7f7f"; // Low success rate (Red)
    if (difficulty === "Medium") return "gold"; // Medium success rate (Orange/Yellow)
    return "#d1ffbd"; // High success rate (Green)
  }

  if (!questions.length) return <p>Loading...</p>;

  return (
    <div className="quiz-container">
      <div className="filters">
        <select
          onChange={handleLanguageChange}
          value={selectedLanguage}
          className="filter-dropdown"
        >
          <option value="">Select Language</option>
          {filteredLanguages.map((language, index) => (
            <option key={index} value={language}>
              {language}
            </option>
          ))}
        </select>

        <select
          onChange={handleSkillAreaChange}
          value={selectedSkillArea}
          className="filter-dropdown"
        >
          <option value="">Select Skill Area</option>
          {filteredSkillAreas.map((skillArea, index) => (
            <option key={index} value={skillArea}>
              {skillArea}
            </option>
          ))}
        </select>
      </div>
      <p className="question">{filteredQuestions[currentQuestion].question}</p>
      <div className="tags">
        <p
          className="tag"
          style={{
            backgroundColor: getDifficultyColor(
              filteredQuestions[currentQuestion].tags.difficulty
            ),
          }}
        >
          {filteredQuestions[currentQuestion].tags.difficulty}
        </p>
        <p
          className="tag"
          style={{
            backgroundColor: getSuccessRateColor(
              filteredQuestions[currentQuestion].correctAttempts,
              filteredQuestions[currentQuestion].totalAttempts
            ),
          }}
        >
          <FaCheckCircle /> : ≈
          {filteredQuestions[currentQuestion].totalAttempts > 0
            ? (
                (filteredQuestions[currentQuestion].correctAttempts * 100) /
                filteredQuestions[currentQuestion].totalAttempts
              ).toFixed(0)
            : 0}
          %
        </p>
        <p className="tag">
          {filteredQuestions[currentQuestion].tags.skillArea}
        </p>
        <p className="tag">
          {filteredQuestions[currentQuestion].tags.language}
        </p>
        <p className="tag">
          Concepts:{" "}
          {filteredQuestions[currentQuestion].tags.concepts.join(", ")}
        </p>
      </div>
      <ul>
        {filteredQuestions[currentQuestion].options.map((option, index) => (
          <li
            id={selectedOption === option ? "selectedOption" : ""}
            key={index}
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </li>
        ))}
      </ul>
      {feedback && <p>{feedback}</p>}
      {showSubmit && <button onClick={() => handleSubmit()}>Submit</button>}
      {showNext && <button onClick={() => handleNextQuestion()}>Next</button>}
    </div>
  );
}

export default Quizlet;
