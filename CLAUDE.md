# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains Tampermonkey userscripts for enhancing BYU OHS Flex Canvas functionality. The primary script is a grade calculator that runs on Canvas grade pages.

## Architecture

**Userscript Structure**: The main file `Flex Grade Calculator.user.js` is a standalone Tampermonkey/Greasemonkey userscript that:
- Runs on BYU OHS Canvas grade pages (matching `https://byuohs.instructure.com/courses/*/grades*`)
- Uses DOM manipulation to extract and calculate grades
- Provides a floating UI overlay for displaying grade summaries
- Visually highlights assignment scores based on performance thresholds

**Key Logic**:
- Iterates through `tr.student_assignment.assignment_graded` rows to calculate completed grades
- Filters out missing assignments (elements with `span.submission-missing-pill`)
- Filters out ungraded assignments (title cells with `div.context` containing "Ungraded")
- Excludes assignments marked as not counting toward final grade
- Calculates two metrics:
  1. Current grade percentage (totalGrade / totalCompleted)
  2. Course progress excluding the Proctored Final Exam (totalCompleted / totalExcludingFinal)

**UI Components**:
- Fixed position toggle button (bottom-right, initially hidden)
- Fixed position grade summary panel (top-right) with close button
- Toggle between showing/hiding the summary
- Color-coded assignment score cells:
  - Light green (#d4edda): All counted grades (when `showCountedGrades` is enabled)
  - Light yellow (#ffffe0): Assignments scoring 90-99% (when `showUnderPerformance` is enabled)
  - Light red (#ffcccb): Assignments scoring below 90% (when `showUnderPerformance` is enabled)
  - No highlight: Assignments scoring 100% (perfect scores)

**Configuration Flags** (lines 17-18):
- `showCountedGrades`: When true, highlights all graded assignments that count toward the final grade with light green
- `showUnderPerformance`: When true, highlights under-performing assignments with yellow (90-99%) or red (<90%)
- `DELTA`: Tolerance value (0.000001) for floating-point comparison when determining perfect scores

## Development Workflow

**Testing**: Install the script in Tampermonkey and navigate to a BYU OHS Canvas grades page. Check the browser console for debug output showing which assignments are being included/excluded.

**Modifying the Script**:
- The userscript metadata block (lines 1-9) defines where and how the script runs
- Update the `@version` number when making changes
- Test changes by reloading the Tampermonkey script and refreshing the Canvas page
- Console.log statements throughout help debug grade calculation logic

## Important Considerations

**DOM Dependencies**: The script relies heavily on Canvas's HTML structure (specific class names like `student_assignment`, `assignment_graded`, `assignment_score`, etc.). Canvas updates could break the script.

**Assignment Filtering Logic**: Multiple conditions determine which assignments count:
- Must have both `student_assignment` and `assignment_graded` classes
- Must not have a missing submission pill
- Must not be marked as "Ungraded"
- Must not have the "does not count toward the final grade" disclaimer
- Proctored Final Exam is excluded from progress calculation only
