DROP TABLE IF EXISTS session_memberships;
DROP TABLE IF EXISTS study_sessions;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE study_sessions (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description TEXT,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  location VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE session_memberships (
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, session_id)
);

INSERT INTO students (id, name, email) VALUES
  (1, 'Alex Morgan', 'alex.morgan@example.com'),
  (2, 'Jordan Lee', 'jordan.lee@example.com'),
  (3, 'Taylor Rivera', 'taylor.rivera@example.com');

INSERT INTO study_sessions
  (id, creator_id, title, subject, description, session_date, session_time, location)
VALUES
  (1, 1, 'Calculus II problem-solving', 'Mathematics',
   'Work through integration techniques and practice problems together.',
   CURRENT_DATE + 1, '14:00', 'Library, Room 204'),
  (2, 2, 'Organic chemistry review', 'Chemistry',
   'Review reaction mechanisms and prepare for the upcoming quiz.',
   CURRENT_DATE + 2, '16:30', 'Science Center, Study Room B'),
  (3, 3, 'Intro to psychology study group', 'Psychology',
   'Compare notes on learning, memory, and cognition.',
   CURRENT_DATE + 3, '11:00', 'Student Union, Table 8');

INSERT INTO session_memberships (student_id, session_id) VALUES
  (1, 1),
  (2, 1),
  (3, 1),
  (1, 2);

SELECT setval(pg_get_serial_sequence('students', 'id'), (SELECT MAX(id) FROM students));
SELECT setval(pg_get_serial_sequence('study_sessions', 'id'), (SELECT MAX(id) FROM study_sessions));
