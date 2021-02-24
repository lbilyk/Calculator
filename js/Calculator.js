class Calculator {

    constructor() {
        this.equation = '';
        this.equationFormatted = '';
        this.calculated = false;
        this.operators = [
            {
                name: '*',
                priority: 1,
            },
            {
                name: '/',
                priority: 1,
            },
            {
                name: '+',
                priority: 2,
            },
            {
                name: '-',
                priority: 2,
            }
        ];
        this.clearOutput();
        this.showEquation();
    };

    showEquation = () => {
        $('#calculatorOutput').val(this.equationFormatted);
    };

    clearOutput = () => {
        this.equation = '';
        this.equationFormatted = '';
        this.showEquation();
    };
    clearError = () => {
        if(this.equationFormatted)
            if(this.equationFormatted.includes('Error'))
                this.clearOutput();
    };
    clearAnswer = () => {
        if (this.calculated === true) {
            this.clearOutput();
            this.calculated = false;
        }
    };

    clear = () => {
        this.clearError();
        this.clearAnswer();
    }

    appendToEquation = (value) => {
        this.clear();
        this.equation += value;
        this.equationFormatted += value;
    };

    appendOperandToEquation = (value) => {
        this.clear();
        if(value === '*')
            this.equationFormatted += '×';
        else if(value === '/')
            this.equationFormatted += '÷';
        else
            this.equationFormatted += value;

        this.equation += value;
    };

    removeLastValue = () => {
        this.clear();
         this.equationFormatted = this.equationFormatted.slice(0, -1);
         this.equation = this.equation.slice(0,-1);
         this.showEquation();
    };

    displayError = (errorType) => {
        this.equationFormatted = errorType + " Error";
        this.showEquation();
    };

    isEquationValid = (equation) => {
        let valid = false;
        const operandStarts = /[+\*/)]/;
        const operandEnds = /[+\-*/(]/;

        if (!(operandEnds.test(equation.charAt(equation.length - 1)) || operandStarts.test(equation.charAt(0))))
            valid = true;
        return valid;
    };

    formatEquation = (equation,type) => {

        const operators = ['+','-','*','/'];
        let zeroIndex = [];

        for (let i = 0; i < equation.length; i++) {
            if(type === '-') {
                if (equation.charAt(i) === '(' && equation.charAt(i + 1) === '-')
                    zeroIndex.push(i + 1);
            }
            else if(type === '.') {
                if (operators.includes(equation.charAt(i)) && equation.charAt(i + 1) === '.')
                    zeroIndex.push(i+1);
            }
        }
        for (let i = 0; i < zeroIndex.length; i++) {
            equation = equation.slice(0, zeroIndex[i]) + '0' + equation.slice(zeroIndex[i]);
        }

        if (equation.charAt(0) === type)
            equation = '0' + equation;

        return equation;
    };

    parseEquation = (equation) => {
        if (!this.isEquationValid(equation))
            return "Error";

        equation = this.formatEquation(equation,'-');

        equation = this.formatEquation(equation,'.');

        let equationTokens = [];
        let numBrackets = 0;
        let thisDigit = '';

        let isDecimal = false; //token is a decimal
        let isParsingNumber = false; //token is a number

        let previousTokenWasOperator = false; //prev token was operator

        for (let i = 0; i < equation.length; i++) {
            let token = equation.charAt(i);

            if (isParsingNumber && isDecimal && token === '.')  // case for two decimals
                return "Error";

            if (/[+\-/*]/.test(token)) {   // case for two operands in a row
                if (previousTokenWasOperator)
                    return "Error";

                previousTokenWasOperator = true;
            } else {
                previousTokenWasOperator = false;
            }

            if (/[0-9]/.test(token)) {
                isParsingNumber = true;
                thisDigit += token;

            } else if (/[+\-/*()]/.test(token)) {
                isParsingNumber = false;
                isDecimal = false;

                if (thisDigit !== '')
                    equationTokens.push(thisDigit);

                thisDigit = '';
                equationTokens.push(token);
            }

            if (isParsingNumber && token === '.') {
                isDecimal = true;
                thisDigit += '.';
            }

            if (token === '(')
                numBrackets++;
            if (token === ')')
                numBrackets--;
        }

        if (numBrackets !== 0)
            return "Error"; // Case for when uneven amount of brackets

        equationTokens.push(thisDigit);

        return equationTokens;
    };

    isOperator = (token) => {
        let isOperator = false;

        if (this.operators.some(op => op.name === token)) {
            isOperator = true;
        }
        return isOperator;
    };

    getLastItemFromStack = (stack) => {
        if (stack.length > 0)
            return stack[stack.length - 1];

        return null;
    };

    comparePriority = (token1, token2) => {

        let priority = -1; // -1 does not have priority

        const priority1 = this.operators.find(operator => operator.name === token1).priority;
        const priority2 = this.operators.find(operator => operator.name === token2).priority;

        if (priority1 < priority2)
            priority = 1; // has priority
        else if (priority1 === priority2)
            priority = 0; // same priority

        return priority;
    };

    performShuntingYard = (equationTokens) => {
        let output = [];
        let stack = [];

        for (let i = 0; i < equationTokens.length; i++) {
            if (this.isOperator(equationTokens[i])) {
                while (stack.length > 0 && this.isOperator(this.getLastItemFromStack(stack))) {
                    if (this.comparePriority(equationTokens[i], this.getLastItemFromStack(stack)) <= 0) {
                        output.push(stack.pop());
                        continue;
                    }
                    break;
                }
                stack.push(equationTokens[i]);
            } else if (equationTokens[i] === '(') {
                stack.push(equationTokens[i]);
            } else if (equationTokens[i] === ')') {
                while (stack.length > 0 && this.getLastItemFromStack(stack) !== '(') {
                    output.push(stack.pop());
                }
                stack.pop();
            } else {
                output.push(equationTokens[i]);
            }
        }
        while (stack.length > 0) {
            output.push(stack.pop());
        }
        return output.filter(Boolean);
    };

    performOperation = (token,top,next) => {
        let result = 0;
        switch (token) {
            case '+':
                result = next + top;
                break;
            case '-':
                result = next - top;
                break;
            case '*':
                result = next * top;
                break;
            case '/':
                result = next / top;
                break;
        }
        return result;
    };

    calculateResult = (equationTokens) => {
        equationTokens = equationTokens.reverse();
        let stack = [];
        while (equationTokens.length > 0) {
            let token = equationTokens.pop();
            if (/[^+\-/*]/.test(token)) {
                stack.push(token);
            } else {
                if (stack.length < 2) {
                    return "Error"; // Case when not enough numbers on stack
                } else {
                    let topNum = Number(stack.pop()); // last num added to stack
                    let nextNum = Number(stack.pop()); // next num added to stack
                    let result = this.performOperation(token,topNum,nextNum);

                    if(result === Infinity)
                        return "Error";

                    stack.push(result);
                }
            }
        }

        if (stack.length === 1) {
            return stack.pop(); //last item in stack is the final answer
        }
        return "Error"; // Case when cannot resolve equation to just one value (result)
    };

    performCalculation = () => {
        this.clear();
        if(this.equation.length) {
            const equationTokens = calculator.parseEquation(this.equation);
            if (equationTokens === "Error")
                calculator.displayError("Syntax");
            else {
                const output = calculator.performShuntingYard(equationTokens);
                const answer = calculator.calculateResult(output);
                if(answer === 'Error') {
                    calculator.displayError("Calculation");
                }
                else{
                    this.calculated = true;
                    this.displayAnswer(answer);
                }
            }
        }
    };
    displayAnswer = (answer) => {
        answer = answer.toString();
        this.clearOutput();
        $('#calculatorOutput').val(answer);
        this.equationFormatted = answer;
        this.equation = answer;
    }
}

const calculator = new Calculator();
let displayScroll = 0;

$('button[data-clr]').bind("click", () => {
    calculator.clearOutput();

    displayScroll = 0;
    $('#calculatorOutput').scrollLeft(displayScroll);
});

$('button[data-num]').bind("click", (event) => {
    const num = $(event.currentTarget).val();
    calculator.appendToEquation(num);
    calculator.showEquation();

    displayScroll += 50;
    $('#calculatorOutput').scrollLeft(displayScroll);
});

$('button[data-op]').bind("click", (event) => {
    const operand = $(event.currentTarget).val();
    calculator.appendOperandToEquation(operand);
    calculator.showEquation();

    displayScroll += 50;
    $('#calculatorOutput').scrollLeft(displayScroll);
});

$('button[data-eq]').bind("click", () => {
    calculator.performCalculation();

    displayScroll = 0;
    $('#calculatorOutput').scrollLeft(displayScroll);
});

$(document).keypress(function(event) {
    if(/[0-9]/.test(event.key)) {
        calculator.appendToEquation(event.key);
        calculator.showEquation();

        displayScroll += 50;
        $('#calculatorOutput').scrollLeft(displayScroll);
    }
    else if(/[\*\(\)\-\+\/\.]/.test(event.key)) {
        calculator.appendOperandToEquation(event.key);
        calculator.showEquation();

        displayScroll += 50;
        $('#calculatorOutput').scrollLeft(displayScroll);
    }
    else if(event.key === "Enter") {
        calculator.performCalculation();

        displayScroll = 0;
        $('#calculatorOutput').scrollLeft(displayScroll);
    }
});

$(document).keydown(function(event) {
   if(event.key === "Backspace") {
       calculator.removeLastValue();

       displayScroll -= 50;
       $('#calculatorOutput').scrollLeft(displayScroll);
   }
   else if(event.key === "Delete" || event.key === "Escape") {
       calculator.clearOutput();

       displayScroll = 0;
       $('#calculatorOutput').scrollLeft(displayScroll);
   }
});










