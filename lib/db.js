const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'smhcss_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Debug: Log connection config (without password for security)
console.log('Database config:', {
  ...dbConfig,
  password: dbConfig.password ? '[SET]' : '[EMPTY]'
});

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database setup queries
const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS smhcss_db;`;

const dropTablesQueries = [
  `DROP TABLE IF EXISTS STUDENT_PROFILE;`,
  `DROP TABLE IF EXISTS TREATMENT_PLAN;`,
  `DROP TABLE IF EXISTS MESSAGE;`,
  `DROP TABLE IF EXISTS NOTIFICATION;`,
  `DROP TABLE IF EXISTS SESSION;`,
  `DROP TABLE IF EXISTS MENTAL_HEALTH_RECORD;`,
  `DROP TABLE IF EXISTS FEEDBACK;`,
  `DROP TABLE IF EXISTS APPOINTMENT;`,
  `DROP TABLE IF EXISTS STUDENT;`,
  `DROP TABLE IF EXISTS COUNSELOR;`,
  `DROP TABLE IF EXISTS ADMIN;`,
  `DROP TABLE IF EXISTS DEPARTMENT;`,
  `DROP TABLE IF EXISTS SPECIALIZATION;`,
  `DROP TABLE IF EXISTS RESOURCE;`
];

const createTablesQueries = [
  // DEPARTMENT table
  `CREATE TABLE IF NOT EXISTS DEPARTMENT (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
  );`,

  // SPECIALIZATION table
  `CREATE TABLE IF NOT EXISTS SPECIALIZATION (
    specialization_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
  );`,

  // ADMIN table
  `CREATE TABLE IF NOT EXISTS ADMIN (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // STUDENT table
  `CREATE TABLE IF NOT EXISTS STUDENT (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    dob DATE,
    gender ENUM('Male', 'Female', 'Other'),
    address TEXT,
    enrollment_no VARCHAR(50) UNIQUE,
    department_id INT,
    last_session_date TIMESTAMP NULL,
    total_sessions INT DEFAULT 0,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE SET NULL
  );`,

  // STUDENT_PROFILE table
  `CREATE TABLE IF NOT EXISTS STUDENT_PROFILE (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL UNIQUE,
    academic_year INT,
    semester INT,
    cgpa DECIMAL(4,2),
    emergency_contact VARCHAR(20),
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE
  );`,

  // COUNSELOR table
  `CREATE TABLE IF NOT EXISTS COUNSELOR (
    counselor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    qualification TEXT,
    license_no VARCHAR(50) UNIQUE,
    specialization_id INT,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialization_id) REFERENCES SPECIALIZATION(specialization_id) ON DELETE SET NULL
  );`,

  // APPOINTMENT table
  `CREATE TABLE IF NOT EXISTS APPOINTMENT (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    mode ENUM('Online', 'In-Person') DEFAULT 'Online',
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected') DEFAULT 'Pending',
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES COUNSELOR(counselor_id) ON DELETE CASCADE
  );`,

  // SESSION table
  `CREATE TABLE IF NOT EXISTS SESSION (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    appointment_id INT NOT NULL UNIQUE,
    counselor_id INT NOT NULL,
    student_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES COUNSELOR(counselor_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE
  );`,

  // MENTAL_HEALTH_RECORD table
  `CREATE TABLE IF NOT EXISTS MENTAL_HEALTH_RECORD (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    record_date DATE NOT NULL,
    summary TEXT,
    diagnosis TEXT,
    observations TEXT,
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES COUNSELOR(counselor_id) ON DELETE CASCADE
  );`,

  // TREATMENT_PLAN table
  `CREATE TABLE IF NOT EXISTS TREATMENT_PLAN (
    plan_id INT PRIMARY KEY AUTO_INCREMENT,
    plan_details TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    record_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES MENTAL_HEALTH_RECORD(record_id) ON DELETE CASCADE
  );`,

  // FEEDBACK table
  `CREATE TABLE IF NOT EXISTS FEEDBACK (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES COUNSELOR(counselor_id) ON DELETE CASCADE
  );`,

  // RESOURCE table
  `CREATE TABLE IF NOT EXISTS RESOURCE (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    type ENUM('Article', 'Video', 'Document', 'Link', 'Audio') NOT NULL,
    url TEXT,
    description TEXT,
    uploaded_by INT,
    uploaded_by_role ENUM('Admin', 'Counselor') DEFAULT 'Admin',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // MESSAGE table
  `CREATE TABLE IF NOT EXISTS MESSAGE (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    from_id INT NOT NULL,
    to_id INT NOT NULL,
    from_role ENUM('Student', 'Counselor', 'Admin') NOT NULL,
    to_role ENUM('Student', 'Counselor', 'Admin') NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE
  );`,

  // NOTIFICATION table
  `CREATE TABLE IF NOT EXISTS NOTIFICATION (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_role ENUM('Student', 'Counselor', 'Admin') NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE
  );`
];

// Insert sample data queries
const insertSampleDataQueries = [
  // Sample departments
  `INSERT IGNORE INTO DEPARTMENT (name) VALUES 
    ('Computer Science'), 
    ('Psychology'), 
    ('Engineering'), 
    ('Business Administration'), 
    ('Medicine');`,

  // Sample specializations
  `INSERT IGNORE INTO SPECIALIZATION (name, description) VALUES 
    ('Anxiety Disorders', 'Specialization in treating anxiety and panic disorders'),
    ('Depression', 'Specialization in treating depression and mood disorders'),
    ('Trauma Therapy', 'Specialization in treating trauma and PTSD'),
    ('Addiction Counseling', 'Specialization in substance abuse and addiction recovery'),
    ('Academic Stress', 'Specialization in academic pressure and performance anxiety');`,

  // Sample admin user (password: admin123)
  `INSERT IGNORE INTO ADMIN (name, email, password) VALUES 
    ('System Administrator', 'admin@smhcss.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');`
];

// Function to initialize database
async function initializeDatabase() {
  let connection;
  try {
    // Create connection without specifying database
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log('Connected to MySQL server');

    // Create database
    await connection.query(createDatabaseQuery);
    console.log('Database created or already exists');

    // Select the database
    await connection.query('USE smhcss_db');
    console.log('Using smhcss_db database');

    // Drop existing tables
    console.log('Dropping existing tables...');
    for (const query of dropTablesQueries) {
      await connection.query(query);
      console.log('Executed table drop query successfully');
    }

    // Create tables
    console.log('Creating tables...');
    for (const query of createTablesQueries) {
      await connection.query(query);
      console.log('Executed table creation query successfully');
    }
    console.log('All tables created successfully');

    // Insert sample data
    for (const query of insertSampleDataQueries) {
      await connection.query(query);
      console.log('Executed sample data insertion query successfully');
    }
    console.log('Sample data inserted successfully');

    console.log('Database initialization completed!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Function to get database connection
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
}

// Function to execute query
async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Close pool function
async function closePool() {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

module.exports = {
  initializeDatabase,
  getConnection,
  executeQuery,
  closePool,
  pool
};

// If this file is run directly, initialize the database
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}