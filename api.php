<?php
/**
 * API PHP pour Sitenrp
 * Gère l'authentification et les rapports avec phpMyAdmin
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Gérer les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'config.php';

// Parser la requête
$request_method = $_SERVER['REQUEST_METHOD'];
$request_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_path = str_replace('/api/', '', $request_path);

// Routes
if ($request_path === 'users' && $request_method === 'GET') {
    handleGetUsers($pdo);
}
elseif ($request_path === 'auth/login' && $request_method === 'POST') {
    handleLogin($pdo);
}
elseif ($request_path === 'auth/register' && $request_method === 'POST') {
    handleRegister($pdo);
}
elseif (preg_match('/^users\/(\d+)\/grade$/', $request_path, $matches) && $request_method === 'PUT') {
    handleChangeGrade($pdo, $matches[1]);
}
elseif (preg_match('/^users\/(\d+)\/password$/', $request_path, $matches) && $request_method === 'PUT') {
    handleChangePassword($pdo, $matches[1]);
}
elseif (preg_match('/^users\/(\d+)$/', $request_path, $matches) && $request_method === 'DELETE') {
    handleDeleteUser($pdo, $matches[1]);
}
elseif ($request_path === 'reports' && $request_method === 'GET') {
    handleGetReports($pdo);
}
elseif ($request_path === 'reports' && $request_method === 'POST') {
    handleCreateReport($pdo);
}
elseif (preg_match('/^reports\/(\d+)$/', $request_path, $matches) && $request_method === 'DELETE') {
    handleDeleteReport($pdo, $matches[1]);
}
else {
    http_response_code(404);
    echo json_encode(['error' => 'Route non trouvée']);
}

/**
 * GET /api/users
 */
function handleGetUsers($pdo) {
    try {
        $stmt = $pdo->prepare('SELECT id, username, grade, createdAt FROM users');
        $stmt->execute();
        $users = $stmt->fetchAll();
        echo json_encode($users);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * POST /api/auth/login
 */
function handleLogin($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Identifiants manquants']);
            return;
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ? AND password = ?');
        $stmt->execute([$data['username'], $data['password']]);
        $user = $stmt->fetch();

        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Identifiants incorrects']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * POST /api/auth/register
 */
function handleRegister($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Identifiants manquants']);
            return;
        }

        // Vérifier si l'utilisateur existe
        $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$data['username']]);
        
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Cet utilisateur existe déjà']);
            return;
        }

        // Créer l'utilisateur
        $stmt = $pdo->prepare('INSERT INTO users (username, password, grade, createdAt) VALUES (?, ?, ?, ?)');
        $stmt->execute([$data['username'], $data['password'], 'Recruté', date('Y-m-d H:i:s')]);

        $newUser = [
            'id' => $pdo->lastInsertId(),
            'username' => $data['username'],
            'password' => $data['password'],
            'grade' => 'Recruté',
            'createdAt' => date('Y-m-d H:i:s')
        ];

        echo json_encode(['success' => true, 'user' => $newUser]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * PUT /api/users/:id/grade
 */
function handleChangeGrade($pdo, $userId) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare('UPDATE users SET grade = ? WHERE id = ?');
        $stmt->execute([$data['grade'], $userId]);

        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'Utilisateur non trouvé']);
            return;
        }

        echo json_encode(['success' => true, 'user' => $user]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * PUT /api/users/:id/password
 */
function handleChangePassword($pdo, $userId) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
        $stmt->execute([$data['password'], $userId]);

        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'Utilisateur non trouvé']);
            return;
        }

        echo json_encode(['success' => true, 'user' => $user]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * DELETE /api/users/:id
 */
function handleDeleteUser($pdo, $userId) {
    try {
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$userId]);

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * GET /api/reports
 */
function handleGetReports($pdo) {
    try {
        $stmt = $pdo->prepare('SELECT id, authorId, authorName, name, firstname, date, content, createdAt FROM reports ORDER BY createdAt DESC');
        $stmt->execute();
        $reports = $stmt->fetchAll();
        echo json_encode($reports);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * POST /api/reports
 */
function handleCreateReport($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        $stmt = $pdo->prepare('INSERT INTO reports (authorId, authorName, name, firstname, date, content, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['authorId'],
            $data['authorName'],
            $data['name'],
            $data['firstname'],
            $data['date'],
            $data['content'],
            date('Y-m-d H:i:s')
        ]);

        $newReport = [
            'id' => $pdo->lastInsertId(),
            'authorId' => $data['authorId'],
            'authorName' => $data['authorName'],
            'name' => $data['name'],
            'firstname' => $data['firstname'],
            'date' => $data['date'],
            'content' => $data['content'],
            'createdAt' => date('Y-m-d H:i:s')
        ];

        echo json_encode(['success' => true, 'report' => $newReport]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * DELETE /api/reports/:id
 */
function handleDeleteReport($pdo, $reportId) {
    try {
        $stmt = $pdo->prepare('DELETE FROM reports WHERE id = ?');
        $stmt->execute([$reportId]);

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
