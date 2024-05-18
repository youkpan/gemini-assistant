import { useEffect, useState } from "react";

/**
 * Custom React Hook: useSpeech
 *
 * This hook provides functionality for speech synthesis, allowing the application
 * to speak provided content.
 *
 * @returns {Object} - An object containing functions and state for speech synthesis.
 * @property {function} speak - Function to initiate speech synthesis for the given content.
 * @property {boolean} isSpeaking - Flag indicating whether speech synthesis is currently in progress.
 */
export const useSpeech = () => {
  // State to store available voices and speech synthesis status
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Effect to update available voices when voices change
  useEffect(() => {
    /**
     * Function to update available voices.
     */
    const updateVoices = () => {
      const foundVoices = window.speechSynthesis.getVoices();
      setVoices(foundVoices);
    };

    // Initial update
    updateVoices();

    // Event listener for voiceschanged event
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

    // Cleanup: Remove event listener when component unmounts
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  /**
   * Function to initiate speech synthesis for the given content.
   *
   * @param {string} content - The content to be spoken.
   * @param {string} voiceName - The name of the voice to be used.
   * @returns {Promise<void>} - A promise that resolves when speech synthesis is complete.
   */
  /**
   * Function to initiate speech synthesis for the given content.
   *
   * @param {string} content - The content to be spoken.
   * @param {string} voiceName - The name of the voice to be used.
   * @returns {Promise<void>} - A promise that resolves when speech synthesis is complete.
   */
  const speak = (content: string, voiceName?: string) => {
    // Check if voices are available
    if (voices.length === 0) {
      return; // Voices not loaded yet
    }

    // Create a SpeechSynthesisUtterance with the specified content
    const utterance = new SpeechSynthesisUtterance(content);

    // Choose the specified voice by name if available, otherwise use the first available voice
    const selectedVoice =
      voiceName && voices.find((voice) => voice.name === voiceName && voice) // Ensure voice is not undefined
        ? voices.find((voice) => voice.name === voiceName)!
        : voices.find((voice) => voice.name.includes("Google US English")) ||
          null;

    utterance.voice = selectedVoice;

    setIsSpeaking(true);

    // Return a promise that resolves when speech synthesis is complete
    return new Promise<void>((resolve) => {
      // Set up onend callback to handle resolution
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      // Start speech synthesis
      speechSynthesis.speak(utterance);
    });
  };

  // Return functions and state for external use
  return { speak, isSpeaking };
  
};
