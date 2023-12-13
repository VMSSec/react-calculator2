import React, { useReducer, useEffect } from "react";
import DigitButton from "./DigitButton";
import OperationButton from "./OperationButton";
import "./styles.css";

export const ACTIONS = {
  ADD_DIGIT: "add-digit",
  CHOOSE_OPERATION: "choose-operation",
  CLEAR: "clear",
  DELETE_DIGIT: "delete-digit",
  EVALUATE: "evaluate",
};

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.ADD_DIGIT:
      if (state.overwrite) {
        return {
          ...state,
          currentOperand: payload.digit,
          overwrite: false,
        }
      }
      if (payload.digit === "0" && state.currentOperand === "0") {
        return state
      }
      if (payload.digit === "." && state.currentOperand.includes(".")) {
        return state
      }

      return {
        ...state,
        currentOperand: `${state.currentOperand || ""}${payload.digit}`,
      }
    case ACTIONS.CHOOSE_OPERATION:
      if (state.currentOperand == null && state.previousOperand == null) {
        return state
      }

      if (state.currentOperand == null) {
        return {
          ...state,
          operation: payload.operation,
        }
      }

      if (state.previousOperand == null) {
        return {
          ...state,
          operation: payload.operation,
          previousOperand: state.currentOperand,
          currentOperand: null,
        }
      }

      return {
        ...state,
        previousOperand: evaluate(state),
        operation: payload.operation,
        currentOperand: null,
      }
      case ACTIONS.CLEAR:
        return {
          overwrite: false,
          currentOperand: null,
          previousOperand: null,
          operation: null,
          history: state.history, // Mantén el historial sin cambios al presionar "AC"
        };
    case ACTIONS.DELETE_DIGIT:
      if (state.overwrite) {
        return {
          ...state,
          overwrite: false,
          currentOperand: null,
        }
      }
      if (state.currentOperand == null) return state
      if (state.currentOperand.length === 1) {
        return { ...state, currentOperand: null }
      }

      return {
        ...state,
        currentOperand: state.currentOperand.slice(0, -1),
      }
      case ACTIONS.EVALUATE:
        if (
          state.operation == null ||
          state.currentOperand == null ||
          state.previousOperand == null
        ) {
          return state;
        }
      
        const result = evaluate(state);
        const operationHistory = `${formatOperand(
          state.previousOperand
        )} ${state.operation} ${formatOperand(
          state.currentOperand
        )} = ${formatOperand(result)}`;
      
        return {
          ...state,
          overwrite: true,
          previousOperand: null,
          operation: null,
          currentOperand: result,
          history: [operationHistory, ...state.history.slice(0, 4)], // Limita el historial a 5 elementos
        }

      case "key":
        const key = payload.key;
      
        if (key === "=") {
          if (state.operation && state.currentOperand && state.previousOperand) {
            const result = evaluate(state);
            const operationHistory = `${formatOperand(
              state.previousOperand
            )} ${state.operation} ${formatOperand(
              state.currentOperand
            )} = ${formatOperand(result)}`;
  
            return {
              ...state,
              overwrite: true,
              previousOperand: null,
              operation: null,
              currentOperand: result,
              history: [operationHistory, ...state.history.slice(0, 4)],
            };
          }
          return state;
        }  else if (key === "Backspace") {
        // Manejar tecla "Backspace"
        if (state.overwrite) {
          return {
            ...state,
            overwrite: false,
            currentOperand: null,
          };
        }
        if (state.currentOperand == null) return state;
        if (state.currentOperand.length === 1) {
          return { ...state, currentOperand: null };
        }
        return {
          ...state,
          currentOperand: state.currentOperand.slice(0, -1),
        };

      } else if (key === "+" || key === "-" || key === "*" || key === "/") {
        // Manejar teclas de operación
        if (state.currentOperand == null && state.previousOperand == null) {
          return state;
        }

        if (state.currentOperand == null) {
          return {
            ...state,
            operation: key,
          };
        }

        if (state.previousOperand == null) {
          return {
            ...state,
            operation: key,
            previousOperand: state.currentOperand,
            currentOperand: null,
          };
        }

        return {
          ...state,
          previousOperand: evaluate(state),
          operation: key,
          currentOperand: null,
        };

      } else {
        // Manejar dígitos y otros caracteres aquí
        if (state.overwrite) {
          return {
            ...state,
            currentOperand: key,
            overwrite: false,
          };
        }

        if (key === "." && state.currentOperand.includes(".")) {
          return state;
        }

        return {
          ...state,
          currentOperand: `${state.currentOperand || ""}${key}`,
        };
      }
  }
}

function evaluate({ currentOperand, previousOperand, operation }) {
  const prev = parseFloat(previousOperand)
  const current = parseFloat(currentOperand)
  if (isNaN(prev) || isNaN(current)) return ""
  let computation = ""
  switch (operation) {
    case "+":
      computation = prev + current
      break
    case "-":
      computation = prev - current
      break
    case "*":
      computation = prev * current
      break
    case "÷":
      computation = prev / current
      break
  }

  return computation.toString()
}

const INTEGER_FORMATTER = new Intl.NumberFormat("en-us", {
  maximumFractionDigits: 0,
})
function formatOperand(operand) {
  if (operand == null) return
  const [integer, decimal] = operand.split(".")
  if (decimal == null) return INTEGER_FORMATTER.format(integer)
  return `${INTEGER_FORMATTER.format(integer)}.${decimal}`
}

function App() {
  const [state, dispatch] = useReducer(reducer, {
    overwrite: false,
    currentOperand: null,
    previousOperand: null,
    operation: null,
    history: [], // Inicializar history como un array vacío
  });

  const previousOperand = state.previousOperand;
  const operation = state.operation;
  const currentOperand = state.currentOperand;

  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key;

      if (key >= "0" && key <= "9") {
        // Manejar dígitos
        dispatch({ type: "key", payload: { key } });
      } else if (key === ".") {
        // Manejar el punto decimal
        dispatch({ type: "key", payload: { key } });
      } else if (key === "Enter" || key === "NumpadEnter") {
        // Manejar Enter
        dispatch({ type: "key", payload: { key: "=" } });
      } else if (key === "Backspace") {
        // Manejar retroceso
        dispatch({ type: "key", payload: { key: "Backspace" } });
      } else if (key === "*") {
        // Manejar multiplicación
        dispatch({ type: "key", payload: { key: "*" } });
      } else if (key === "/") {
        // Manejar división
        dispatch({ type: "key", payload: { key: "/" } });
      } else if (key === "+" || key === "NumpadAdd") {
        // Manejar suma
        dispatch({ type: "key", payload: { key: "+" } });
      } else if (key === "-" || key === "NumpadSubtract") {
        // Manejar resta
        dispatch({ type: "key", payload: { key: "-" } });
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [dispatch]);

  return (  
    <div className="calculator-grid">
      <div className="output">
        <div className="previous-operand">
          {formatOperand(previousOperand)} {operation}
        </div>
        <div className="current-operand">{formatOperand(currentOperand)}</div>
      </div>
      <button
        className="span-two"
        onClick={() => dispatch({ type: ACTIONS.CLEAR })}
      >
        AC
      </button>
      <button onClick={() => dispatch({ type: ACTIONS.DELETE_DIGIT })}>
        DEL
      </button>
      <OperationButton operation="÷" dispatch={dispatch} />
      <DigitButton digit="1" dispatch={dispatch} />
      <DigitButton digit="2" dispatch={dispatch} />
      <DigitButton digit="3" dispatch={dispatch} />
      <OperationButton operation="*" dispatch={dispatch} />
      <DigitButton digit="4" dispatch={dispatch} />
      <DigitButton digit="5" dispatch={dispatch} />
      <DigitButton digit="6" dispatch={dispatch} />
      <OperationButton operation="+" dispatch={dispatch} />
      <DigitButton digit="7" dispatch={dispatch} />
      <DigitButton digit="8" dispatch={dispatch} />
      <DigitButton digit="9" dispatch={dispatch} />
      <OperationButton operation="-" dispatch={dispatch} />
      <DigitButton digit="." dispatch={dispatch} />
      <DigitButton digit="0" dispatch={dispatch} />
      <button
        className="span-two"
        onClick={() => dispatch({ type: ACTIONS.EVALUATE })}
      >
        =
      </button>
      <div className="history">
        <h2>Historial de Operaciones:</h2>
        <ul>
          {state.history.map((operation, index) => (
            <li key={index}>{operation}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App;
