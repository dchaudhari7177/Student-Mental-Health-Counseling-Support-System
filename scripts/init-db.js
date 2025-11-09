const mysql = require('mysql2/promise');

async function initializeDatabase() {
  try {
    // Create connection without database selection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',  // Change this to your MySQL root password
    });

    console.log('Connected to MySQL server');

    // Create database if not exists
    await connection.execute('CREATE DATABASE IF NOT EXISTS smhcss_db');
    console.log('Database created or already exists');

    // Use the database
    await connection.execute('USE smhcss_db');
    console.log('Using smhcss_db database');

    // Create tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS DEPARTMENT (
        department_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE
      );
    `);
    console.log('DEPARTMENT table created');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS SPECIALIZATION (
        specialization_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT
      );
    `);
    console.log('SPECIALIZATION table created');

    // Insert sample data
    await connection.execute(`
      INSERT IGNORE INTO DEPARTMENT (name) VALUES 
      ('Computer Science'),
      ('Electronics'),
      ('Mechanical'),
      ('Civil'),
      ('Chemical');
    `);
    console.log('Sample departments inserted');

    await connection.execute(`
      INSERT IGNORE INTO SPECIALIZATION (name, description) VALUES 
      ('Anxiety and Depression', 'Specialized in treating anxiety disorders and depression'),
      ('Academic Stress', 'Focused on academic-related stress and performance anxiety'),
      ('Career Counseling', 'Guidance for career choices and professional development'),
      ('Relationship Issues', 'Help with interpersonal relationships and social anxiety'),
      ('General Mental Health', 'Comprehensive mental health support and counseling');
    `);
    console.log('Sample specializations inserted');

    await connection.end();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDatabase();