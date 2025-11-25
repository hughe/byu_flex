// ==UserScript==
// @name         Flex Grade Calculator
// @namespace    http://tampermonkey.net/
// @version      2.8
// @description  Calculate total grades from assignment scores
// @author       Claude Sonnet 4.5 prompted by Hugh Emberson <hugh.emberson@gmail.com>
// @match        https://byuohs.instructure.com/courses/*/grades*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Log script version
    console.log('Flex Grade Calculator v2.8');

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

	// For some reason the row showed up recently in Will's
	// Geometry I part 2 course and it shows as been marked, which
	// it isn't and the score was 0/50. So it threw things off by
	// a lot.
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
                // Get the text content of the grade span (the number inside)
                const gradeText = gradeSpan.textContent.trim();
                const gradeNumber = parseFloat(gradeText);

                // Find the next span sibling (which contains "/ XX")
                const nextSpan = gradeSpan.nextElementSibling;

                if (nextSpan && !isNaN(gradeNumber)) {
                    // Extract the number from "/ XX" format
                    const totalText = nextSpan.textContent.trim();
                    const totalNumber = parseFloat(totalText.replace('/', '').trim());

                    if (!isNaN(totalNumber)) {
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
				// pass.
			    } else if(percentage > 0.9) {
				// Highlight under-performing
				// assignments with light yellow
				// background
				scoreCell.style.backgroundColor = '#ffffe0';
				scoreCell.style.padding = '2px 4px';
				scoreCell.style.borderRadius = '3px';
			    } else if(totalNumber > 0) {
				// Highlight poorly performing assignments with light red background
				scoreCell.style.backgroundColor = '#ffcccb';
				scoreCell.style.padding = '2px 4px';
				scoreCell.style.borderRadius = '3px';
			    }
			}

                        console.log(`Found: ${gradeNumber} / ${totalNumber}`);
                    }
                }
            }
        }
    });

    const all_rows = document.querySelectorAll('tr.student_assignment');

    // Calculate totalExcludingFinal by iterating through all rows again
    all_rows.forEach(row => {
        // Check if this is the Proctored Final Exam
        const titleCell = row.querySelector('th.title');

        // Skip rows that contain a div.context with "Ungraded" text in the title cell
        const contextDiv = titleCell ? titleCell.querySelector('div.context') : null;
        if (contextDiv && contextDiv.textContent.trim() === 'Ungraded') {
            console.log('Skipping ungraded assignment (excluding final calculation)');
            return;
        }

        // Check if the next sibling row contains "does not count toward the final grade"
        const nextRow = row.nextElementSibling;
        if (nextRow && nextRow.textContent.includes('This assignment does not count toward the final grade.')) {
            console.log('Skipping assignment that does not count toward final grade (excluding final calculation)');
            return;
        }

        const titleLink = titleCell ? titleCell.querySelector('a') : null;
        const title = titleLink ? titleLink.textContent.trim() : null;
        const isProctoredFinal = title && title.startsWith('Proctored Final Exam');

        // Skip if it's the proctored final
        if (isProctoredFinal) {
            return;
        }

        // Find the td with class "assignment_score"
        const scoreCell = row.querySelector('td.assignment_score');

        if (scoreCell) {
            const gradeSpan = scoreCell.querySelector('span.grade');

            if (gradeSpan) {
                const nextSpan = gradeSpan.nextElementSibling;

                if (nextSpan) {
                    const totalText = nextSpan.textContent.trim();
                    const totalNumber = parseFloat(totalText.replace('/', '').trim());

                    if (!isNaN(totalNumber)) {
                        console.log("Found: ", title, " value: ", totalNumber);
                        totalExcludingFinal += totalNumber;
                    }
                }
            }
        }
    });

    //console.log('Total Grade:', totalGrade);
    //console.log('Total Possible:', totalCompleted);
    //console.log('Total Possible (Excluding Final):', totalExcludingFinal);
    //console.log('Percentage:', totalCompleted > 0 ? ((totalGrade / totalCompleted) * 100).toFixed(2) + '%' : 'N/A');

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
        <p style="margin: 5px 0;"><strong>Total Grade:</strong> ${totalGrade.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Total Possible:</strong> ${totalCompleted.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Percentage:</strong> ${totalCompleted > 0 ? ((totalGrade / totalCompleted) * 100).toFixed(2) + '%' : 'N/A'}</p>
        <h3 style="margin: 10px 0 10px 0; font-size: 1.5em;">Progress</h3>
        <p style="margin: 5px 0;"><strong>Total Grades (Excluding Final):</strong> ${totalExcludingFinal.toFixed(2)}</p>
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
                <span>Not attempted</span>
            </div>
        </div>
    `;
    document.body.appendChild(resultDiv);

    // Add click event to close button
    document.getElementById('closeGradeSummary').addEventListener('click', function() {
        resultDiv.style.display = 'none';
        toggleButton.style.display = 'block';
    });

    // Add click event to show button
    toggleButton.addEventListener('click', function() {
        resultDiv.style.display = 'block';
        toggleButton.style.display = 'none';
    });
})();
