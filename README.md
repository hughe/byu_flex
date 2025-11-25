# Tampermonkey Scripts for Making the BYU OHS Canvas Easier to Use for Flex Students

## Flex Grade Calculator

A Tampermonkey userscript that enhances the BYU OHS Canvas grade page with automatic grade calculation and visual performance indicators.

### Features

- **Automatic Grade Calculation**: Calculates your total grade and course progress automatically
- **Visual Performance Indicators**: Color-codes assignment scores to quickly identify areas needing attention:
  - 🟢 **Light Green**: All graded assignments that count toward your final grade
  - 🟡 **Light Yellow**: Assignments scoring 90-99% (room for improvement)
  - 🔴 **Light Red**: Assignments scoring below 90% (needs attention)
  - ⚪ **No highlight**: Perfect scores (100%)
- **Grade Summary Panel**: Displays total grade, percentage, and progress excluding the final exam
- **Smart Filtering**: Automatically excludes missing assignments, ungraded work, and assignments that don't count toward the final grade

### Installation

1. **Install Tampermonkey** (if you haven't already):
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Safari](https://apps.apple.com/us/app/tampermonkey/id1482490089)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **Install the Script**:
   - Click on the Tampermonkey icon in your browser
   - Select "Create a new script"
   - Delete the default content
   - Copy the contents of `Flex Grade Calculator.user.js` from this repository
   - Paste into the editor
   - Save (File → Save or Ctrl/Cmd+S)

3. **Use the Script**:
   - Navigate to any BYU OHS Canvas course grades page (`https://byuohs.instructure.com/courses/*/grades*`)
   - The script runs automatically and highlights your assignment scores
   - Click the "Show Grades" button in the bottom-right corner to see your grade summary
   - Click the × to close the summary panel

### Configuration

You can customize the script behavior by editing the configuration flags at the top of the script (lines 17-18):

```javascript
const showCountedGrades = true;      // Show green highlight on all counted grades
const showUnderPerformance = true;   // Show yellow/red highlights on under-performing assignments
```

