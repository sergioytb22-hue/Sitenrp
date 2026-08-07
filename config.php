<?php
/**
 * Configuration de connexion à la base de données
 */

$DB_HOST = 'localhost';
$DB_USER = 'Narutsu_';
$DB_PASS = 'Natsu2108@';
$DB_NAME = 'brivzdoc_sitenrp';

// Connexion à la base de données
try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    die(json_encode(['error' => 'Erreur de connexion à la base de données: ' . $e->getMessage()]));
}

// Créer les tables si elles n'existent pas
try {
    // Table des utilisateurs
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            grade VARCHAR(255) DEFAULT 'Recruté',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // Table des rapports
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            authorId INT NOT NULL,
            authorName VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            firstname VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            content LONGTEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    // Vérifier si l'admin existe
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute(['admin']);
    $adminExists = $stmt->fetch();

    if (!$adminExists) {
        $stmt = $pdo->prepare('INSERT INTO users (username, password, grade, createdAt) VALUES (?, ?, ?, ?)');
        $stmt->execute(['admin', 'admin123', 'Administrateur', date('Y-m-d H:i:s')]);
    }
} catch (Exception $e) {
    // Les tables existent déjà, c'est normal
}
?>
