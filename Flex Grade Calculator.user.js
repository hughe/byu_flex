// ==UserScript==
// @name         Flex Grade Calculator
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Calculate total grades from assignment scores (supports both points and percentage modes)
// @author       Claude Sonnet 4.5 prompted by Hugh Emberson <hugh.emberson@gmail.com>
// @match        https://byuohs.instructure.com/courses/*/grades*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Log script version
    console.log('Flex Grade Calculator v3.3 - Fixed totalExcludingFinal to use graded rows only');

    const showCountedGrades = true;
    const showUnderPerformance = true;

    const DELTA = 0.000001;

    // Find all tr elements with both classes "student_assignment" and "assignment_graded"
    const rows = document.querySelectorAll('tr.student_assignment.assignment_graded');

    let totalGrade = 0;
    let totalCompleted = 0;
    let totalExcludingFinal = 0;

    rows.forEach(row => {
        // Skip rows that contain a missing submission pill
        if (row.querySelector('span.submission-missing-pill')) {
            console.log('Skipping missing assignment');
            return;
        }

        // Skip rows that contain a div.context with "Ungraded" text in the title cell
        const titleCell = row.querySelector('th.title');

	const titleCellLink = titleCell ? titleCell.querySelector('a') : null;
	if(titleCellLink && titleCellLink.textContent.trim() === "Final Exam Shell") {
            console.log('Skipping Final Exam Shell');
            return;
        }

        const contextDiv = titleCell ? titleCell.querySelector('div.context') : null;
        if (contextDiv && contextDiv.textContent.trim() === 'Ungraded') {
            console.log('Skipping ungraded assignment');
            return;
        }

        // Check if the next sibling row contains "does not count toward the final grade"
        const nextRow = row.nextElementSibling;
        if (nextRow && nextRow.textContent.includes('This assignment does not count toward the final grade.')) {
            console.log('Skipping assignment that does not count toward final grade');
            return;
        }

        // Find the td with class "assignment_score"
        const scoreCell = row.querySelector('td.assignment_score');

        if (scoreCell) {
            // Find the span with class "grade"
            const gradeSpan = scoreCell.querySelector('span.grade');

            if (gradeSpan) {
                let gradeNumber = null;
                let totalNumber = null;
                
                // Find the next span sibling (which contains "/ XX" in points mode)
                const nextSpan = gradeSpan.nextElementSibling;
                
                // Check if this is points mode (has "/ XX" sibling) or percentage mode
                const isPointsMode = nextSpan && nextSpan.textContent.includes('/');
                
                if (isPointsMode) {
                    // POINTS MODE: Get grade from last child text node or original_points
                    const lastChild = gradeSpan.childNodes[gradeSpan.childNodes.length - 1];
                    if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
                        const gradeText = lastChild.textContent.trim();
                        gradeNumber = parseFloat(gradeText);
                    }
                    
                    // Fallback to original_points
                    if (isNaN(gradeNumber) || gradeNumber === null) {
                        const originalPoints = scoreCell.querySelector('span.original_points');
                        if (originalPoints) {
                            gradeNumber = parseFloat(originalPoints.textContent.trim());
                        }
                    }
                    
                    // Extract total points from "/ XX" format
                    const totalText = nextSpan.textContent.trim();
                    totalNumber = parseFloat(totalText.replace('/', '').trim());
                    
                } else {
                    // PERCENTAGE MODE: Extract percentage from displayed text
                    // In percentage mode, we average percentages, not points
                    // So treat each assignment as 100 points possible
                    const lastChild = gradeSpan.childNodes[gradeSpan.childNodes.length - 1];
                    if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
                        const displayText = lastChild.textContent.trim();
                        // parseFloat("60%") returns 60
                        const percentage = parseFloat(displayText);
                        if (!isNaN(percentage)) {
                            gradeNumber = percentage;
                            totalNumber = 100;
                        }
                    }
                }

                if (!isNaN(gradeNumber) && !isNaN(totalNumber) && totalNumber > 0) {
                    totalGrade += gradeNumber;
                    totalCompleted += totalNumber;
                    const percentage = gradeNumber / totalNumber;

                    // Highlight counted grades with light green background
                    if(showCountedGrades) {
                        scoreCell.style.backgroundColor = '#d4edda';
                        scoreCell.style.padding = '2px 4px';
                        scoreCell.style.borderRadius = '3px';
                    }

                    if(showUnderPerformance) {
                        if(Math.abs(percentage - 1.0) < DELTA) {
                            // pass - 100%
                        } else if(percentage > 0.9) {
                            scoreCell.style.backgroundColor = '#ffffe0';
                            scoreCell.style.padding = '2px 4px';
                            scoreCell.style.borderRadius = '3px';
                        } else if(totalNumber > 0) {
                            scoreCell.style.backgroundColor = '#ffcccb';
                            scoreCell.style.padding = '2px 4px';
                            scoreCell.style.borderRadius = '3px';
                        }
                    }

                    console.log(`Found: ${gradeNumber} / ${totalNumber}`);
                }
            }
        }
    });

    // FIXED: Use assignment_graded rows only, not all rows
    // This gives us "work completed / work that has been graded so far"
    // rather than "work completed / all future work"
    const all_rows = document.querySelectorAll('tr.student_assignment.assignment_graded');

    all_rows.forEach(row => {
        const titleCell = row.querySelector('th.title');

        const contextDiv = titleCell ? titleCell.querySelector('div.context') : null;
        if (contextDiv && contextDiv.textContent.trim() === 'Ungraded') {
            return;
        }

        const nextRow = row.nextElementSibling;
        if (nextRow && nextRow.textContent.includes('This assignment does not count toward the final grade.')) {
            return;
        }

        const titleLink = titleCell ? titleCell.querySelector('a') : null;
        const title = titleLink ? titleLink.textContent.trim() : null;
        const isProctoredFinal = title && title.startsWith('Proctored Final Exam');

        if (isProctoredFinal) {
            return;
        }

        const scoreCell = row.querySelector('td.assignment_score');

        if (scoreCell) {
            const gradeSpan = scoreCell.querySelector('span.grade');

            if (gradeSpan) {
                const nextSpan = gradeSpan.nextElementSibling;
                let totalNumber = null;

                if (nextSpan && nextSpan.textContent.includes('/')) {
                    // Points mode
                    const totalText = nextSpan.textContent.trim();
                    totalNumber = parseFloat(totalText.replace('/', '').trim());
                } else {
                    // Percentage mode - count as 100 points each
                    totalNumber = 100;
                }

                if (!isNaN(totalNumber)) {
                    console.log("Found: ", title, " value: ", totalNumber);
                    totalExcludingFinal += totalNumber;
                }
            }
        }
    });

    console.log('Total Grade:', totalGrade);
    console.log('Total Possible:', totalCompleted);
    console.log('Total Possible (Excluding Final):', totalExcludingFinal);
    console.log('Percentage:', totalCompleted > 0 ? ((totalGrade / totalCompleted) * 100).toFixed(2) + '%' : 'N/A');

    // Create the toggle button (initially hidden)
    const toggleButton = document.createElement('button');
    toggleButton.id = 'showGradeSummary';
    toggleButton.textContent = 'Show Grades';
    toggleButton.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: #333; color: #fff; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; z-index: 10000; font-family: Arial, sans-serif; font-size: 0.7em; display: none;';
    document.body.appendChild(toggleButton);

    // Create the grade summary display
    const resultDiv = document.createElement('div');
    resultDiv.style.cssText = 'position: fixed; top: 50px; right: 10px; background: #fff; border: 2px solid #333; padding: 18px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 10000; font-family: Arial, sans-serif; font-size: 0.72em;';
    resultDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; font-size: 1.5em;">Grade Summary</h3>
            <button id="closeGradeSummary" style="background: none; border: none; font-size: 2em; cursor: pointer; padding: 0; margin-left: 15px; color: #666; line-height: 1;">&times;</button>
        </div>
        <p style="margin: 5px 0;"><strong>Current Marks:</strong> ${totalGrade.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Current Attempted:</strong> ${totalCompleted.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Current Grade:</strong> ${totalCompleted > 0 ? ((totalGrade / totalCompleted) * 100).toFixed(2) + '%' : 'N/A'}</p>
        <h3 style="margin: 10px 0 10px 0; font-size: 1.5em;">Progress</h3>
        <p style="margin: 5px 0;"><strong>Total Grades In Course (Ex Final):</strong> ${totalExcludingFinal.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Work Handed-in &amp; Marked:</strong> ${totalExcludingFinal > 0 ? ((totalCompleted / totalExcludingFinal) * 100).toFixed(2) + '%' : 'N/A'}</p>
        <h3 style="margin: 10px 0 10px 0; font-size: 1.5em;">Color Key</h3>

        <div style="margin: 5px 0;">
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <span style="display: inline-block; width: 15px; height: 15px; background-color: #d4edda; border: 1px solid #ccc; border-radius: 3px; margin-right: 8px;"></span>
                <span>100%</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <span style="display: inline-block; width: 15px; height: 15px; background-color: #ffffe0; border: 1px solid #ccc; border-radius: 3px; margin-right: 8px;"></span>
                <span>90-99% (room for improvement)</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <span style="display: inline-block; width: 15px; height: 15px; background-color: #ffcccb; border: 1px solid #ccc; border-radius: 3px; margin-right: 8px;"></span>
                <span>&lt;90% (needs attention)</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <span style="display: inline-block; width: 15px; height: 15px; background-color: #ffffff; border: 1px solid #ccc; border-radius: 3px; margin-right: 8px;"></span>
                <span>Not attempted or ungraded</span>
            </div>
        </div>
    `;
    document.body.appendChild(resultDiv);

    document.getElementById('closeGradeSummary').addEventListener('click', function() {
        resultDiv.style.display = 'none';
        toggleButton.style.display = 'block';
    });

    toggleButton.addEventListener('click', function() {
        resultDiv.style.display = 'block';
        toggleButton.style.display = 'none';
    });
})();
