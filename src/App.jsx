import { useCallback, useState, useEffect } from 'react'
import './App.css'
import { ValidFiveLetterWords, FiveLetterAnswersArray } from './data/ValidWords'

function App() 
{

  const [answer, setAnswer] = useState(() => GenerateRandomAnswer());
  const [currGuess, setCurrGuess] = useState("");
  const [prevGuesses, setPrevGuesses] = useState([]);
  const [absentLetters, setAbsentLetters] = useState(new Set());
  const [correctLetters, setCorrectLetters] = useState(new Set());
  const [presentLetters, setPresentLetters] = useState(new Set());
  const [updatedLettersState, setUpdatedLettersState] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [definition, setDefinition] = useState("");
  const [definitionLoaded, setDefinitionLoaded] = useState(false);

  const handleKeyPress = useCallback((key) => {
    if (gameOver)
      return;

    if (/^[A-Z]$/.test(key))
      {
        setCurrGuess(prev => 
        {
          if (prev.length < 5)
            return prev + key;
          return prev;
        });
      }
      else if (key === "BACKSPACE")
      {
        setCurrGuess(prev => 
        {
          if (prev.length > 0)
            return prev.slice(0, -1);
          return prev;
        });
      }
      else if (key === "ENTER")
      {
        if (!ValidateWord(currGuess))
          return;

        setCurrGuess("");
        setPrevGuesses(prev => [...prev, currGuess]);

        const revealTime = 1700; // milliseconds
        setTimeout(() => {
          for (let i = 0; i < currGuess.length; i++)
          {
            const letter = currGuess[i];
            if (letter === answer[i]) 
            {
              if (correctLetters.has(letter))
                continue;
              setCorrectLetters(prev => new Set(prev).add(letter));
              setUpdatedLettersState(prev => ({...prev, [letter]: presentLetters.has(letter) ? "var(--tile-present)" : "var(--tile-unused)"}));
              setPresentLetters(prev => 
              {
                const next = new Set(prev);
                next.delete(letter);
                return next;
              });
            }
            else if (answer.includes(letter) )
            {
              if (presentLetters.has(letter) || correctLetters.has(letter))
                continue;
              setPresentLetters(prev => new Set(prev).add(letter));
              setUpdatedLettersState(prev => ({...prev, [letter]: "var(--tile-unused)"}));
            }

            else if (!absentLetters.has(letter))
            {
              setAbsentLetters(prev => new Set(prev).add(letter));
              setUpdatedLettersState(prev => ({...prev, [letter]: "var(--tile-unused)"}));
            }
          }

          const keysAnimTime = 300;
          setTimeout(() => {
            setUpdatedLettersState({});
            if (currGuess === answer)
            {
              setGameOver(true);
              setGameWon(true);
              SetDefinitionValues(answer);
            }
            else if (prevGuesses.length === 4)
            {
              setGameOver(true);
              setGameWon(false);
              SetDefinitionValues(answer);
            }
          }, keysAnimTime);

          
        }, revealTime)

        
    
      }
  }, [currGuess, prevGuesses, answer, absentLetters, correctLetters, presentLetters, gameOver]);

  // handle keydown events for letter input, backspace, and enter
  useEffect(() => 
  {
    function HandleKeyDown(event) 
    {
      const key = event.key.toUpperCase();

      // prevent default behavior, causes last pressed key to be "pressed" again
      if (key === "ENTER")
        event.preventDefault();

      handleKeyPress(key);
    }

    window.addEventListener('keydown', HandleKeyDown);

    return () => 
    {
      window.removeEventListener('keydown', HandleKeyDown);
    }

  }, [handleKeyPress]);

  

  function ResetGame() 
  {
    setPrevGuesses([]);
    setAbsentLetters(new Set());
    setCorrectLetters(new Set());
    setPresentLetters(new Set());
    setUpdatedLettersState({});
    setGameOver(false);
    setGameWon(false);
    setAnswer(GenerateRandomAnswer());
  }

  async function SetDefinitionValues(word)
  {
    setDefinition("");
    setDefinitionLoaded(false);
    word = word.toLowerCase();
    try 
    {
      const response = await fetch(`https://freedictionaryapi.com/api/v1/entries/en/${word}`);
      if (!response.ok) 
      {
        throw new Error('Word not found');
      }
      const data = await response.json();
      console.log('API response:', data);
      const definition = data.entries[0].senses[0].definition;
      console.log(`Definition of ${word}: ${definition}`);
      setDefinition(definition);
      setDefinitionLoaded(true);
      return definition;
    }
    catch (error)
    {
      console.error('Error fetching definition:', error);
      setDefinition("Definition not found.");
      setDefinitionLoaded(true);
      return null;
    }
  }

  function ValidateWord(word) 
  {
    return ValidFiveLetterWords.has(word);
  }

  function CheckWord(word) 
  {
    const result = [];
    const usedIndices = new Set();
    if (word.length !== 5)
      return result;

    for (let i = 0; i < word.length; i++)
    {
      if (word[i] === answer[i])
      {
        result.push("correct");
        usedIndices.add(i);
        continue;
      }
      let found = false;
      for (let j = 0; j < answer.length; j++)
      {
        if (word[i] === answer[j] && word[j] !== answer[j] && !usedIndices.has(j))
        {
          result.push("present");
          usedIndices.add(j);
          found = true;
          break;
        }
      }
      if (!found)
        result.push("missing");
    }

    return result;
  }

  function GetKeyClass(key) 
  {
    if (key === "BACKSPACE" || key === "ENTER")
      return "";
    if (absentLetters.has(key))
      return "missing";
    if (correctLetters.has(key))
      return "correct";
    if (presentLetters.has(key))
      return "present";

    return "unused";
  }

  function GenerateRandomAnswer()
  {
    const randomIndex = Math.floor(Math.random() * FiveLetterAnswersArray.length);
    return FiveLetterAnswersArray[randomIndex];
  }

  

  return (
    <>
      <div className="game-container">
        <div>
          <h1>Five To Solve</h1>
        </div>
        <div className="game-board">
          {Array.from({ length: 5 }, (_, rowIndex) => {
            const guess = prevGuesses[rowIndex] ?? (rowIndex === prevGuesses.length ? currGuess : "");
            const tileClasses = (guess === prevGuesses[rowIndex]) ? CheckWord(guess) : [];
            const newGuess = rowIndex === (prevGuesses.length - 1);
            return (
              <div className="guess-row" key={rowIndex}>
                {Array.from({ length: 5 }, (_, tileIndex) => {
                  const letter = guess[tileIndex] ?? "";
                  const tileClass = tileClasses[tileIndex] ?? "missing";
                  const reveal = newGuess? "reveal" : "";
                  return (
                    <div className={`tile ${tileClass} ${reveal}`} key={tileIndex} style={{ animationDelay: `${tileIndex * 300}ms` }}>
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="keyboard">
          {Array.from({ length: 3 }, (_, rowIndex) => {
            const keys = rowIndex === 0 ? ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"] 
                       : rowIndex === 1 ? ["A", "S", "D", "F", "G", "H", "J", "K", "L"] 
                                        : ["BACKSPACE","Z", "X", "C", "V", "B", "N", "M", "ENTER"];
            return (
              <div className="keyboard-row" key={rowIndex}> 
                {keys.map(key => 
                  {
                    const keyboardClass = key === "BACKSPACE" || key === "ENTER" ? "keyboard-large-key" : "keyboard-key";
                    const keyClass = GetKeyClass(key);
                    const playAnimation = Object.hasOwn(updatedLettersState, key);
                    const previousState = playAnimation ? updatedLettersState[key] : "";
                    return (
                    <button 
                      type="button" 
                      className ={`${keyboardClass} ${keyClass} ${playAnimation ? "key-updated" : ""}`}
                      key={key}
                      style={{ "--previous-color-state": previousState }}
                      onClick= {() => handleKeyPress(key)}
                    >
                      {key === "BACKSPACE" ? "DEL" : key}
                    </button>
                    );
                })}

              </div>
            );
          })}
        </div>
          {gameOver && (
            <div className="game-over-overlay" role="dialog" aria-modal="true">
              <div className="game-over-panel">
                <h2>{gameWon ? "You solved it!" : "Game over"}</h2>

                {<p>The word was {answer}.</p>}

                <div className="definition-container">
                  <p id="definition-text">{definitionLoaded ? definition : ""}</p>
                </div>

                <button type="button" onClick={ResetGame}>
                  New Game
                </button>
              </div>
            </div>
          )}
      </div>
   </>
  )
}

export default App
