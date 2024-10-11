import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const VoiceRecognition = () => {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [chat, setChat] = useState([]);
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "es-ES";

      recognitionRef.current.onresult = async (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        setChat((prevChat) => [
          { role: "user", content: transcriptText },
          ...prevChat,
        ]);

        try {
          const result = await axios.post(
            "http://localhost:5000/api/generate-response",
            {
              transcript: transcriptText,
            }
          );
          setResponse(result.data.response);
          setChat((prevChat) => [
            { role: "assistant", content: result.data.response },
            ...prevChat,
          ]);
        } catch (error) {
          console.error("Error al generar respuesta: ", error);
          setResponse("No se pudo generar una respuesta. Verifica el backend.");
          setChat((prevChat) => [
            {
              role: "assistant",
              content: "No se pudo generar una respuesta. Verifica el backend.",
            },
            ...prevChat,
          ]);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Error en reconocimiento de voz: ", event.error);
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          recognitionRef.current.stop();
          setIsRecognitionActive(false);
        }
      };
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === " " && !isRecognitionActive) {
        event.preventDefault();
        // Iniciar reconocimiento con tecla Espacio
        recognitionRef.current.start();
        setIsRecognitionActive(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === " " && isRecognitionActive) {
        event.preventDefault();
        // Detener reconocimiento al soltar tecla Espacio
        recognitionRef.current.stop();
        setIsRecognitionActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecognitionActive]);

  const handleMouseDown = () => {
    if (!isRecognitionActive) {
      recognitionRef.current.start();
      setIsRecognitionActive(true);
    }
  };

  const handleMouseUp = () => {
    if (isRecognitionActive) {
      recognitionRef.current.stop();
      setIsRecognitionActive(false);
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{ height: "100vh" }}
    >
      <h1>Asistente de Voz</h1>
      <div className="chat-container">
        {chat.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user" ? "user-message" : "assistant-message"
            }
          >
            <strong>
              {message.role === "user" ? "Usuario:" : "Asistente:"}
            </strong>{" "}
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceRecognition;
