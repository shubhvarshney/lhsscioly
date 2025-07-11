import { useState } from "react";
import Modal from "./Modal";
import testService from "../services/tests";
import questionService from "../services/questions";
import imageService from "../services/images";
import questionGen from "../services/questionGen";
import { Link } from "react-router-dom";
import QuestionItem from "./QuestionItem";

const CreateTest = (props) => {
  const [open, setOpen] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState([""]);
  const [answer, setAnswer] = useState("");
  const [type, setType] = useState("");
  const [points, setPoints] = useState(1);
  const [choices, setChoices] = useState([]);
  const [choice, setChoice] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");
  const [event, setEvent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [questionPDF, setQuestionPDF] = useState("");
  const [answerPDF, setAnswerPDF] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const isCommaSeparatedSingleLetters = (str) => {
    return str
      .split(",")
      .map((s) => s.trim())
      .every((s) => /^[A-Za-z]$/.test(s));
  };

  const addQuestion = () => {
    if (type.length === 0) {
      props.setError("Type of question required!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        props.setError(null);
      }, 5000);
      return;
    } else if (question.every(part => !part.trim())) {
      props.setError("Question required!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        props.setError(null);
      }, 5000);
    } else if (answer.length === 0) {
      props.setError("Answer required!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        props.setError(null);
        return;
      }, 5000);
      return;
    } else if (type === "mcq") {
      if (!choices || choices.length < 2) {
        props.setError("Choices required for multiple choice question!");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          props.setError(null);
        }, 5000);
        return;
      } else if (!isCommaSeparatedSingleLetters(answer)) {
        props.setError(
          "Invalid formatting of answers. Separate multiple answers with commas.",
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          props.setError(null);
        }, 5000);
        return;
      }
    }

    setQuestions(
      questions.concat({
        type,
        question,
        choices,
        points,
        answer,
        selectedFile,
      }),
    );
    setQuestion([""]);
    setAnswer("");
    setType("");
    setPoints(1);
    setChoices([]);
    setSelectedFile(null);
  };

  const createTest = async (e) => {
    e.preventDefault();
    if (!event) {
      props.setError("Event required!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        props.setError(null);
      }, 5000);
      return;
    } else if (!school) {
      props.setError("Tournament name required!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        props.setError(null);
      }, 5000);
      return;
    } else if (!year) {
      props.setError("Test year required!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        props.setError(null);
      }, 5000);
      return;
    } else if (questions.length === 0) {
      props.setError("Questions are required!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        props.setError(null);
      }, 5000);
      return;
    }

    if (props.tests.find((t) => t.school === school && t.year === year)) {
      props.setError("Test already uploaded to bank");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        props.setError(null);
      }, 5000);
      return;
    }
    const questionIds = [];
    props.setNotif("Processing Test...");
    for (const q of questions) {
      let imageUrl;
      if (q.selectedFile) {
        imageUrl = await imageService.getImageUrl(q.selectedFile);
      }
      console.log(imageUrl);
      const addedQuestion = await questionService.createQuestion({
        event,
        school,
        year,
        type: q.type,
        question: q.question,
        points: q.points,
        choices: q.choices,
        answer: q.answer,
        imageUrl,
      });
      if (addedQuestion) {
        questionIds.push(addedQuestion.id);
      }
    }
    const addedTest = await testService.createTest({
      event,
      random: false,
      school,
      year,
      questions: questionIds,
    });
    console.log("Added Test");
    props.setNotif("Added Test", addedTest);
    props.setTests(props.tests.concat(addedTest));
    setQuestions([]);
    setQuestion([""]);
    setAnswer("");
    setType("");
    setPoints(1);
    setChoices([]);
    setSelectedFile(null);
    setEvent("");
    setSchool("");
    setYear("");
    setTimeout(() => {
      props.setNotif(null);
    }, 5000);
  };

  const genQuestions = async (e) => {
    e.preventDefault();
    setModalOpen(false);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    props.setNotif("Processing PDFs...");
    const res = await questionGen.createQuestions(questionPDF, answerPDF);

    let cleaned = res.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    }

    try {
      const questions = JSON.parse(cleaned);
      // Normalize questions to ensure question field is always an array
      const normalizedQuestions = questions.map(q => ({
        ...q,
        question: Array.isArray(q.question) ? q.question : [q.question]
      }));
      setQuestions(normalizedQuestions);
      setQuestionPDF(false);
      setAnswerPDF(false);
      props.setNotif("Questions loaded!");
      setTimeout(() => {
        props.setNotif(null);
      }, 5000);
    } catch (error) {
      props.setNotif(null);
      props.setError("Error loading questions");
      setTimeout(() => {
        props.setError(null);
      }, 5000);
      console.log("Error", error);
    }
  };

  if (!props.user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-md shadow-md">
      <form className="space-y-6" onSubmit={createTest}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-orange-800">
            Create Test
          </h2>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition text-md font-medium"
            >
              Save Test
            </button>
            <Link
              to="/tests"
              className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition text-md font-medium"
            >
              Test Bank
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Tournament Name
            </label>
            <input
              value={school}
              onChange={({ target }) => setSchool(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
              placeholder="Ex: Libertyville High School"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Year
            </label>
            <input
              value={year}
              onChange={({ target }) => setYear(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
              placeholder="Ex: 2025"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-orange-800 mb-1">
            Event
          </label>
          <select
            value={event}
            onChange={({ target }) => setEvent(target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
          >
            <option value="" disabled selected>
              Select Event
            </option>
            {props.events.map((e) => (
              <option key={e.name} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        {open ? (
          <div>
            <div className="bg-orange-50 p-6 rounded-md border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-700 mb-4">
                Add Question
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">
                    Question
                  </label>
                  <div className="space-y-2">
                    {question.map((part, partIndex) => (
                      <div key={partIndex} className="flex gap-2 border border-gray-300 rounded-md p-2">
                        <textarea
                          value={part}
                          onChange={(e) => {
                            const newQuestion = [...question];
                            newQuestion[partIndex] = e.target.value;
                            setQuestion(newQuestion);
                          }}
                          placeholder={partIndex === 0 ? "Question text..." : "Additional part (e.g., cipher)..."}
                          rows={3}
                          className="flex-1 px-3 py-2 focus:ring-orange-400 focus:ring-2"
                        />
                        {question.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newQuestion = question.filter((_, idx) => idx !== partIndex);
                              setQuestion(newQuestion);
                            }}
                            className="text-red-500 font-bold text-2xl rounded-md hover:text-red-600 self-start"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setQuestion([...question, ""]);
                      }}
                      className="text-orange-600 hover:underline text-sm"
                    >
                      + Add Part
                    </button>
                    {question.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuestion([question.join('\n\n')]);
                        }}
                        className="ml-4 text-amber-600 hover:underline text-sm"
                      >
                        Merge into Single Part
                      </button>
                    )}
                    {question.length === 1 && question[0].includes('\n') && (
                      <button
                        type="button"
                        onClick={() => {
                          const parts = question[0].split('\n\n').filter(part => part.trim() !== '');
                          if (parts.length > 1) {
                            setQuestion(parts);
                          } else {
                            // If no double newlines found, try splitting by single newlines
                            const singleParts = question[0].split('\n').filter(part => part.trim() !== '');
                            if (singleParts.length > 1) {
                              setQuestion(singleParts);
                            } else {
                              alert('No clear separation found. Use double line breaks (\\n\\n) or single line breaks to separate parts.');
                            }
                          }
                        }}
                        className="ml-4 text-blue-600 hover:underline text-sm"
                      >
                        Split into Parts
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={({ target }) => setType(target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
                  >
                    <option value="" disabled>
                      Select question type
                    </option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="saq">Short Answer</option>
                    <option value="leq">Paragraph/Long Answer</option>
                  </select>
                </div>

                {type === "mcq" && (
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1">
                      Add Choices
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={choice}
                        onChange={({ target }) => setChoice(target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
                        placeholder="Ex: H20"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (choice.trim() === "") return;
                          setChoices([...choices, choice.trim()]);
                          setChoice("");
                        }}
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
                      >
                        Add
                      </button>
                    </div>
                    {choices.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {choices.map((c, i) => (
                          <div
                            key={c}
                            className="flex items-center justify-between gap-3 px-4 py-2 bg-orange-100 rounded-md shadow-sm border border-orange-200"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-orange-600 font-semibold">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              <span className="text-gray-800">{c}</span>
                            </div>
                            <div className="flex justify-end">
                              <button
                                className="text-orange-600 font-medium"
                                onClick={() =>
                                  setChoices(
                                    choices.filter((choice) => choice !== c),
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {type === "leq" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-800 mb-1">
                        Answer
                      </label>
                      <textarea
                        value={answer}
                        onChange={({ target }) => setAnswer(target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-800 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        value={points}
                        onChange={({ target }) => setPoints(target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-800 mb-1">
                        Answer (s)
                      </label>
                      <input
                        value={answer}
                        onChange={({ target }) => setAnswer(target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
                        placeholder="Ex: A, B"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-800 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        value={points}
                        onChange={({ target }) => setPoints(target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">
                    Image
                  </label>
                  {selectedFile ? (
                    <div className="mt-4 w-full">
                      <div className="flex justify-between items-center pb-2">
                        <p className="text-sm text-orange-700 mb-1 font-medium">
                          Preview:
                        </p>
                        <button
                          className="text-orange-600 font-medium text-3xl hover:text-orange-700"
                          type="button"
                          onClick={() => setSelectedFile(null)}
                        >
                          ×
                        </button>
                      </div>
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="w-full border border-orange-300 rounded-md shadow"
                      />
                    </div>
                  ) : (
                    <label
                      htmlFor="file-upload-add"
                      className="flex items-center justify-center px-4 py-3 bg-orange-100 border-2 border-dashed border-orange-300 rounded-md cursor-pointer hover:bg-orange-200 transition select-none"
                    >
                      <input
                        id="file-upload-add"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                      />
                      <span className="text-sm text-orange-700 font-medium">
                        Click to upload image
                      </span>
                    </label>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition font-semibold"
                >
                  Save Question
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bg-orange-50 mb-2 text-orange-700 font-semibold hover:underline"
                >
                  Close Question Editor
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block mx-auto bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition font-semibold"
          >
            Open Question Editor
          </button>
        )}
      </form>

      <div className="mt-5">
        <button
          onClick={() => {
            setModalOpen(true);
            setQuestionPDF(null);
            setAnswerPDF(null);
          }}
          className="block mx-auto bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition font-semibold"
        >
          Add Questions From PDF
        </button>
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
          }}
          title="Add Questions From PDF"
        >
          <form onSubmit={genQuestions} className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={({ target }) => setQuestionPDF(target.files[0])}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                 file:rounded-md file:border-0 file:text-sm file:font-semibold
                 file:bg-orange-100 file:text-orange-800 hover:file:bg-orange-200
                 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={({ target }) => setAnswerPDF(target.files[0])}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                 file:rounded-md file:border-0 file:text-sm file:font-semibold
                 file:bg-orange-100 file:text-orange-800 hover:file:bg-orange-200
                 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition duration-200"
            >
              Upload
            </button>
          </form>
        </Modal>
      </div>

      <ul className="mb-8 mt-10 space-y-4">
        {questions.length > 0 ? (
          questions.map((q, i) => (
            <QuestionItem
              key={i}
              q={q}
              index={i}
              onEdit={(idx, updatedQ) => {
                setQuestions(
                  questions.map((item, j) => (j === idx ? updatedQ : item)),
                );
              }}
              onDelete={(idx) => {
                setQuestions(questions.filter((_, j) => j !== idx));
              }}
            />
          ))
        ) : (
          <div className="border-2 border-dashed border-orange-300 rounded-md p-6 text-center text-orange-700 italic bg-orange-50">
            No questions added yet. Use the forms above to add questions.
          </div>
        )}
      </ul>
    </div>
  );
};

export default CreateTest;
