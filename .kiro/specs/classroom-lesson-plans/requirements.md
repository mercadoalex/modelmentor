# Requirements Document

## Introduction

ModelMentor is an educational ML platform where students build, train, and test real ML models step by step. This feature adds a classroom-ready lesson plan system that speaks the language of educators. It provides an in-app curriculum library with browsable, filterable lesson plans aligned to CSTA and ISTE standards, covering grades 6-12 (US) / Secundaria and Preparatoria (Mexico). Teachers can browse, view detailed lesson plans, assign them, and export formatted PDFs for printing. The system builds upon the existing TeacherResourcesPage and lessonPlans data structure, extending them into a full curriculum library with standards alignment, differentiation strategies, rubrics, and student handouts.

The platform targets both US and Latin American (primarily Mexican) school systems. Grade bands map as follows: grades 6-8 corresponds to Secundaria (1°-3°), and grades 9-12 corresponds to Preparatoria/Bachillerato (1°-3°). Standards alignment uses CSTA and ISTE as internationally recognized frameworks, with localized labels for the Mexican education system (SEP Pensamiento Computacional / Tecnología).

## Glossary

- **Lesson_Plan_Library**: The in-app page where teachers browse, filter, and select lesson plans from the curriculum collection
- **Lesson_Plan**: A structured teaching document containing objectives, standards alignment, procedures, assessments, differentiation strategies, teacher notes, and rubrics tied to a specific ModelMentor project type
- **PDF_Exporter**: The component responsible for generating formatted, printable PDF documents from lesson plan data
- **Grade_Band**: A grouping of grade levels, either 6-8 (middle school / Secundaria in Mexico) or 9-12 (high school / Preparatoria-Bachillerato in Mexico)
- **CSTA_Standard**: A Computer Science Teachers Association standard code and description defining expected student competencies
- **ISTE_Standard**: An International Society for Technology in Education standard code and description defining technology literacy expectations
- **SEP_Alignment**: Reference to Mexico's Secretaría de Educación Pública curriculum areas (Pensamiento Computacional, Tecnología) that correspond to the CSTA/ISTE standards covered
- **Lesson_Procedure**: The sequenced instructional flow of a lesson plan consisting of warm-up/hook, direct instruction, guided practice, independent practice, and closure/reflection phases
- **Differentiation_Strategy**: Instructional modifications that address diverse learner needs, including scaffolding for struggling learners and extensions for advanced learners
- **Rubric**: A scoring guide with defined criteria and performance levels used to evaluate student ML project work
- **Student_Handout**: A printable companion worksheet designed for student use during the lesson
- **Teacher_Role**: A user with the role of teacher, admin, or super_admin who has access to educator-specific features
- **Filter_Panel**: The UI component allowing teachers to narrow lesson plans by grade band, subject area, duration, and model type
- **Localization_Service**: The existing i18next-based internationalization system supporting English and Spanish content

## Requirements

### Requirement 1: Lesson Plan Library Page

**User Story:** As a teacher, I want to browse a library of classroom-ready lesson plans, so that I can quickly find relevant curriculum materials for my ML instruction.

#### Acceptance Criteria

1. WHEN a Teacher_Role user navigates to the Lesson_Plan_Library, THE Lesson_Plan_Library SHALL display all available lesson plans as browsable cards showing title, grade band, subject area, duration, and model type
2. THE Lesson_Plan_Library SHALL provide a Filter_Panel allowing teachers to filter lesson plans by grade band (6-8 / Secundaria or 9-12 / Preparatoria), subject area, estimated duration, and model type (image classification, text classification, regression)
3. WHEN a teacher applies one or more filters, THE Lesson_Plan_Library SHALL display only lesson plans matching all selected filter criteria within 200ms
4. WHEN no lesson plans match the applied filters, THE Lesson_Plan_Library SHALL display a message indicating no results and suggest broadening the filter criteria
5. THE Lesson_Plan_Library SHALL be accessible only to users with Teacher_Role (teacher, admin, or super_admin)
6. WHEN a non-Teacher_Role user attempts to access the Lesson_Plan_Library, THE Lesson_Plan_Library SHALL redirect the user and display an access denied message

### Requirement 2: Lesson Plan Detail View

**User Story:** As a teacher, I want to view a complete lesson plan with all instructional sections, so that I can prepare to deliver the lesson in my classroom.

#### Acceptance Criteria

1. WHEN a teacher selects a lesson plan from the Lesson_Plan_Library, THE Lesson_Plan_Library SHALL navigate to a detail view displaying all lesson plan sections
2. THE Lesson_Plan detail view SHALL display the following sections: title, grade band, subject area, duration/pacing, learning objectives, standards alignment, materials needed, lesson procedure, assessment strategy, differentiation strategies, teacher notes, student handout description, and rubric
3. THE Lesson_Plan detail view SHALL organize the lesson procedure into five sequential phases: warm-up/hook, direct instruction, guided practice with ModelMentor, independent practice, and closure/reflection
4. THE Lesson_Plan detail view SHALL display each phase with estimated time allocation and step-by-step instructions
5. THE Lesson_Plan detail view SHALL include references to specific ModelMentor features (guided tour, learning moments, training page, testing page) within the guided practice phase

### Requirement 3: Standards Alignment

**User Story:** As a teacher, I want lesson plans aligned to CSTA and ISTE standards, so that I can demonstrate curriculum compliance to administrators and parents.

#### Acceptance Criteria

1. THE Lesson_Plan SHALL include at least one CSTA_Standard code and description relevant to the lesson content
2. THE Lesson_Plan SHALL include at least one ISTE_Standard code and description relevant to the lesson content
3. THE Lesson_Plan detail view SHALL display standards alignment in a dedicated section with the standard code, standard name, and a brief description of how the lesson addresses the standard
4. WHEN a teacher filters by a specific standard, THE Lesson_Plan_Library SHALL display only lesson plans aligned to that standard
5. WHEN the active language is Spanish, THE Lesson_Plan detail view SHALL display the corresponding SEP_Alignment reference (Pensamiento Computacional / Tecnología) alongside the CSTA and ISTE codes to help Mexican educators identify curriculum relevance

### Requirement 4: Assessment Strategy

**User Story:** As a teacher, I want structured assessment criteria including formative and summative options, so that I can evaluate student learning effectively.

#### Acceptance Criteria

1. THE Lesson_Plan SHALL include a formative assessment section referencing ModelMentor in-app indicators (quiz scores, matching activity completion, learning moment engagement)
2. THE Lesson_Plan SHALL include a summative assessment section with a project-based Rubric
3. THE Rubric SHALL define at least three performance levels (e.g., Beginning, Developing, Proficient, Advanced) for each criterion
4. THE Rubric SHALL include criteria covering conceptual understanding, technical execution, and critical thinking
5. THE Lesson_Plan detail view SHALL display the Rubric in a table format with criteria as rows and performance levels as columns

### Requirement 5: Differentiation Strategies

**User Story:** As a teacher, I want differentiation guidance for diverse learners, so that I can support struggling students and challenge advanced students within the same lesson.

#### Acceptance Criteria

1. THE Lesson_Plan SHALL include scaffolding strategies for struggling learners with at least three specific modifications
2. THE Lesson_Plan SHALL include extension activities for advanced learners with at least three specific challenges
3. THE Lesson_Plan detail view SHALL display differentiation strategies in a dedicated section organized by learner level (struggling, on-level, advanced)
4. THE Differentiation_Strategy section SHALL reference specific ModelMentor features that support each learner level (e.g., guided tour for struggling learners, independent exploration for advanced learners)

### Requirement 6: PDF Export

**User Story:** As a teacher, I want to export any lesson plan as a formatted PDF, so that I can print it for offline reference or share it with colleagues who do not use ModelMentor.

#### Acceptance Criteria

1. WHEN a teacher clicks the export button on a lesson plan detail view, THE PDF_Exporter SHALL generate a formatted PDF document containing all lesson plan sections
2. THE PDF_Exporter SHALL format the PDF with clear headings, readable fonts, appropriate margins, and page breaks between major sections
3. THE PDF_Exporter SHALL include the Rubric as a formatted table in the exported PDF
4. THE PDF_Exporter SHALL include the Student_Handout as a separate page section in the exported PDF suitable for photocopying
5. THE PDF_Exporter SHALL include a header with the lesson plan title, grade band, and ModelMentor branding on each page
6. WHEN the PDF generation completes, THE PDF_Exporter SHALL trigger a browser download of the PDF file with a filename based on the lesson plan title
7. IF PDF generation fails, THEN THE PDF_Exporter SHALL display an error message and suggest the teacher use the browser print function as a fallback

### Requirement 7: Student Handout

**User Story:** As a teacher, I want a printable student handout for each lesson, so that students have a companion worksheet to guide their hands-on work with ModelMentor.

#### Acceptance Criteria

1. THE Lesson_Plan SHALL include a Student_Handout with guided prompts, reflection questions, and space indicators for student responses
2. THE Student_Handout SHALL reference the specific ModelMentor workflow steps the student will complete during the lesson
3. THE Student_Handout SHALL be viewable as a separate tab or section within the lesson plan detail view
4. THE PDF_Exporter SHALL render the Student_Handout as a standalone printable page within the exported PDF

### Requirement 8: Teacher Notes

**User Story:** As a teacher, I want pedagogical notes including common misconceptions and discussion prompts, so that I can anticipate student challenges and facilitate deeper learning.

#### Acceptance Criteria

1. THE Lesson_Plan SHALL include teacher notes identifying at least three common student misconceptions related to the ML concepts covered
2. THE Lesson_Plan SHALL include at least five discussion prompts distributed across the lesson procedure phases
3. THE Lesson_Plan SHALL include practical tips for classroom management during hands-on ModelMentor activities
4. THE Lesson_Plan detail view SHALL display teacher notes in a visually distinct section (e.g., highlighted callout or sidebar) to differentiate them from student-facing content

### Requirement 9: Pre-Authored Lesson Plan Content

**User Story:** As a teacher, I want ready-to-use lesson plans covering the main ModelMentor project types, so that I can start teaching immediately without creating materials from scratch.

#### Acceptance Criteria

1. THE Lesson_Plan_Library SHALL include at least one complete lesson plan for image classification projects targeting grade band 6-8
2. THE Lesson_Plan_Library SHALL include at least one complete lesson plan for image classification projects targeting grade band 9-12
3. THE Lesson_Plan_Library SHALL include at least one complete lesson plan for text classification projects targeting grade band 9-12
4. THE Lesson_Plan_Library SHALL include at least one complete lesson plan for regression projects targeting grade band 9-12
5. WHEN a lesson plan references a ModelMentor feature, THE Lesson_Plan SHALL use the current feature name and navigation path accurately
6. THE pre-authored lesson plans SHALL cover durations ranging from 45 minutes (single period) to 90 minutes (block period) to accommodate different school schedules

### Requirement 10: Localization Support

**User Story:** As a teacher in a Spanish-speaking environment, I want lesson plans available in Spanish, so that I can use them with my students without translation effort.

#### Acceptance Criteria

1. THE Lesson_Plan_Library SHALL render all UI labels, buttons, and navigation elements in the user-selected language (English or Spanish) using the existing Localization_Service
2. THE Lesson_Plan content (titles, objectives, procedures, rubrics, handouts) SHALL be available in both English and Spanish
3. WHEN a teacher switches the application language, THE Lesson_Plan_Library SHALL display lesson plan content in the selected language without requiring a page reload
4. THE PDF_Exporter SHALL generate the PDF in the language currently selected by the teacher

### Requirement 11: Navigation and Integration

**User Story:** As a teacher, I want the lesson plan library integrated into the existing teacher navigation, so that I can access it alongside other teacher tools without confusion.

#### Acceptance Criteria

1. THE ModelMentor SHALL provide navigation to the Lesson_Plan_Library from the existing TeacherResourcesPage and TeacherDashboardPage
2. THE Lesson_Plan_Library SHALL use the existing AppLayout component for consistent page structure and navigation
3. WHEN a lesson plan references a ModelMentor project workflow step, THE Lesson_Plan detail view SHALL include a link or reference to the corresponding application page
4. THE Lesson_Plan_Library route SHALL be accessible at a dedicated URL path within the application routing structure
