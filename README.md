# 🎓 Interactive Quiz Master
> **A Professional Computer Based Test (CBT) Interface** built with pure HTML, CSS, and Vanilla JavaScript.

This project is designed to be **clean, simple, and easy to understand**. It simulates a real-world online exam system without using any complex frameworks or backend databases.

---

## 📂 Project Structure

Just three main files work together to make this app:

1.  **`index.html` (The Skeleton)**: Holds all the screens (Views) and elements.
2.  **`style.css` (The Skin)**: Makes it look professional, clean, and academic.
3.  **`script.js` (The Brain)**: Handles the logic (clicking, timer, calculating scores).

---

## 🏗️ 1. HTML: The "Single Page" Trick

Instead of having 5 different HTML files for 5 pages, we use **one file** with multiple **sections**. This makes the app faster and smoother.

### How it works:
*   We created 5 `<section>` tags, one for each view:
    *   `#creator-view`: To create a quiz.
    *   `#dashboard-view`: To list all quizzes.
    *   `#setup-view`: To set the timer.
    *   `#quiz-view`: To take the test.
    *   `#result-view`: To see scores.
*   **The Logic:** At any given time, **only one** section is visible. All others have a CSS class called `.hidden` (which simply does `display: none`).
*   **Javascript's Job:** When you click a button, JS removes `.hidden` from the section you want to see and adds it to the others.

---

## 🎨 2. CSS: Professional Design

We chose a "clean academic" style to look like a serious exam portal.

*   **Variables (`:root`)**: We defined colors like `--primary-color` (Blue) once at the top. If we want to change the app color to Red, we change it in **one place**.
*   **Card Design**: The white box in the center has `max-width: 700px` and `margin: auto` to keep it centered on any screen size.
*   **Feedback**: When you hover over an option, it turns light blue. When selected, it gets a darker blue border. This helps the user know their click registered.

---

## 🧠 3. JavaScript: Code Deep Dive

This is where the magic happens. The code is organized into **5 Logical Parts**. Here is exactly how it works.

### 🔹 Part 1: "The Memory" (State Management)
*Lines 1-7*
Just like a calculator needs memory to store numbers, our app needs variables to remember what's happening.

```javascript
let quizzes = [];           // A Big Array to store EVERY quiz you create.
let currentQuiz = null;     // Which quiz did you click on? (Holds one object)
let currentQuestionIndex = 0; // Are we on Q1? Q2? (starts at 0)
let userAnswers = [];       // Stores your choices: [0, 2, 1, ... ] (Index of selected options)
let timeLeft = 0;           // Timer countdown in seconds
```
> **Analogy**: `quizzes` is a bookshelf. `currentQuiz` is the book you are reading right now. `currentQuestionIndex` is the page number.

### 🔹 Part 2: "The Navigator" (View Management)
*Lines 46-51 (`showView` function)*

This is the traffic controller. It handles moving between screens.
1.  **Input**: You pass an ID like `'quiz-view'`.
2.  **Action 1**: It loops through ALL views and adds the class `.hidden` (CSS: `display: none`).
3.  **Action 2**: It finds the specific view you asked for and removes `.hidden`.

### 🔹 Part 3: "The Creator" (Making Quizzes)
*Lines 57-147 (`saveQuiz`, `addQuestionInput`)*

This logic turns your HTML form inputs into a structured JavaScript Object.

*   **Adding Questions**: When you click "+ Add Question", it creates a new HTML block dynamically (`document.createElement`) and sticks it into the page.
*   **Saving**:
    1.  It loops through every question block on the screen.
    2.  It captures: **Question Text**, **4 Options**, and **Which Radio Button is Checked**.
    3.  It bundles them into an object: `{ text: "...", options: [...], correctIndex: 1 }`.
    4.  It pushes this object into the main `quizzes` array.

### 🔹 Part 4: "The Engine" (Taking the Quiz)
This is the most complex part. It handles the specific flow of taking a test.

#### 🏁 A. Starting (`beginQuiz`)
*   Sets `currentQuestionIndex = 0`.
*   Clears previous `userAnswers`.
*   Calculates total seconds (Minutes * 60) and starts the **Timer**.

#### ⏱️ B. The Timer (`startTimer`, `updateTimerDisplay`)
*   Uses `setInterval(function, 1000)`: This tells the browser "Run this code every 1000 milliseconds (1 second)".
*   **Every second**:
    1.  `timeLeft--` (Subtract 1).
    2.  Update the text (convert 90s -> 1:30).
    3.  **Check**: Is time <= 0? If yes, force submit (`endQuiz(true)`).
    4.  **Visual Warning**: If time is < 15% of total, add `.warning` class (turns text red).

#### 📺 C. Rendering Questions (`renderQuestion`)
*   It grabs the question for the current page: `currentQuiz.questions[currentQuestionIndex]`.
*   It deletes the current HTML in the question box.
*   It creates new Radio Buttons for the options.
*   **Smart Feature**: It checks `userAnswers`. If you already answered this (and went back), it re-selects your previous choice so you don't lose it.

#### ⏭️ D. Moving Forward (`nextQuestion`)
1.  **Validation**: It looks for `input:checked`. If nothing is checked, it shows an alert/message and STOPS.
2.  **Saving**: It saves the index (0, 1, 2, or 3) into `userAnswers[currentQuestionIndex]`.
3.  **Decision**:
    *   Any questions left? -> Call `renderQuestion()` for the next index.
    *   No questions left? -> Call `endQuiz()`.

### 🔹 Part 5: "The Judge" (Results & Scoring)
*Lines 335-379 (`calculateResults`)*

This function runs when the quiz ends. It grades you.

1.  **The Loop**: It goes through every question in the quiz.
2.  **Comparison**:
    ```javascript
    if (userChoice === correctChoice) {
        score++; // Give a point
    }
    ```
3.  **Review Generation**:
    It creates a detailed report card.
    *   Using **Template Literals** (backticks `` ` ``), it builds HTML that shows:
        *   Question Text
        *   **"Your Answer"**: What you picked.
        *   **"Correct Answer"**: What you should have picked.
    *   It applies CSS classes `correct` (Green border) or `wrong` (Red border) to each item.

---

## � Summary for Viva / Interviews
*   **"How do you switch pages?"**: "I don't! I use DOM manipulation to hide/show sections using CSS classes."
*   **"Where is data stored?"**: "In a JavaScript array of objects in memory."
*   **"How does the timer work?"**: "Using `setInterval` to decrement a counter variable every second."

Enjoy your Quiz Master! 🎯
