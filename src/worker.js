/**
 * Cloudflare Worker pour Sitenrp
 * Gère l'authentification et les rapports
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Lire les utilisateurs depuis KV
 */
async function readUsers(env) {
    try {
        const stored = await env.DATA.get('users');
        if (!stored) {
            // Créer l'admin par défaut
            const defaultAdmin = [{
                id: 1,
                username: 'admin',
                password: 'admin123',
                grade: 'Administrateur',
                createdAt: new Date().toISOString()
            }];
            await env.DATA.put('users', JSON.stringify(defaultAdmin));
            return defaultAdmin;
        }
        return JSON.parse(stored);
    } catch (error) {
        console.error('Erreur lecture users:', error);
        return [];
    }
}

/**
 * Sauvegarder les utilisateurs dans KV
 */
async function writeUsers(env, users) {
    try {
        await env.DATA.put('users', JSON.stringify(users));
    } catch (error) {
        console.error('Erreur écriture users:', error);
    }
}

/**
 * Lire les rapports depuis KV
 */
async function readReports(env) {
    try {
        const stored = await env.DATA.get('reports');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Erreur lecture reports:', error);
        return [];
    }
}

/**
 * Sauvegarder les rapports dans KV
 */
async function writeReports(env, reports) {
    try {
        await env.DATA.put('reports', JSON.stringify(reports));
    } catch (error) {
        console.error('Erreur écriture reports:', error);
    }
}

/**
 * Répondre avec JSON
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS
        }
    });
}

/**
 * Route: GET /api/users
 */
async function handleGetUsers(env) {
    const users = await readUsers(env);
    return jsonResponse(users);
}

/**
 * Route: POST /api/auth/login
 */
async function handleLogin(env, request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return jsonResponse({ success: false, error: 'Identifiants manquants' }, 400);
        }

        const users = await readUsers(env);
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            return jsonResponse({ success: true, user });
        } else {
            return jsonResponse({ success: false, error: 'Identifiants incorrects' }, 401);
        }
    } catch (error) {
        console.error('Erreur login:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Route: POST /api/auth/register
 */
async function handleRegister(env, request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return jsonResponse({ error: 'Identifiants manquants' }, 400);
        }

        const users = await readUsers(env);

        if (users.find(u => u.username === username)) {
            return jsonResponse({ error: 'Cet utilisateur existe déjà' }, 400);
        }

        const newUser = {
            id: Math.max(...users.map(u => u.id), 0) + 1,
            username,
            password,
            grade: 'Recruté',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeUsers(env, users);

        return jsonResponse({ success: true, user: newUser });
    } catch (error) {
        console.error('Erreur register:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Route: PUT /api/users/:id/grade
 */
async function handleChangeGrade(env, request, userId) {
    try {
        const { grade } = await request.json();
        const users = await readUsers(env);

        const user = users.find(u => u.id === parseInt(userId));
        if (!user) {
            return jsonResponse({ error: 'Utilisateur non trouvé' }, 404);
        }

        user.grade = grade;
        await writeUsers(env, users);

        return jsonResponse({ success: true, user });
    } catch (error) {
        console.error('Erreur changeGrade:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Route: PUT /api/users/:id/password
 */
async function handleChangePassword(env, request, userId) {
    try {
        const { password } = await request.json();
        const users = await readUsers(env);

        const user = users.find(u => u.id === parseInt(userId));
        if (!user) {
            return jsonResponse({ error: 'Utilisateur non trouvé' }, 404);
        }

        user.password = password;
        await writeUsers(env, users);

        return jsonResponse({ success: true, user });
    } catch (error) {
        console.error('Erreur changePassword:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Route: DELETE /api/users/:id
 */
async function handleDeleteUser(env, userId) {
    try {
        const users = await readUsers(env);
        const filtered = users.filter(u => u.id !== parseInt(userId));
        await writeUsers(env, filtered);

        return jsonResponse({ success: true });
    } catch (error) {
        console.error('Erreur deleteUser:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Route: GET /api/reports
 */
async function handleGetReports(env) {
    const reports = await readReports(env);
    return jsonResponse(reports);
}

/**
 * Route: POST /api/reports
 */
async function handleCreateReport(env, request) {
    try {
        const { authorId, authorName, name, firstname, date, content, image } = await request.json();
        const reports = await readReports(env);

        const newReport = {
            id: Date.now(),
            authorId,
            authorName,
            name,
            firstname,
            date,
            content,
            image: image || null,
            createdAt: new Date().toISOString()
        };

        reports.push(newReport);
        await writeReports(env, reports);

        return jsonResponse({ success: true, report: newReport });
    } catch (error) {
        console.error('Erreur createReport:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Route: DELETE /api/reports/:id
 */
async function handleDeleteReport(env, reportId) {
    try {
        const reports = await readReports(env);
        const filtered = reports.filter(r => r.id !== parseInt(reportId));
        await writeReports(env, filtered);

        return jsonResponse({ success: true });
    } catch (error) {
        console.error('Erreur deleteReport:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Routeur principal
 */
export default {
    async fetch(request, env) {
        // Gérer CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: CORS_HEADERS
            });
        }

        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // Routes
        if (path === '/api/users' && method === 'GET') {
            return handleGetUsers(env);
        }

        if (path === '/api/auth/login' && method === 'POST') {
            return handleLogin(env, request);
        }

        if (path === '/api/auth/register' && method === 'POST') {
            return handleRegister(env, request);
        }

        if (path.match(/^\/api\/users\/\d+\/grade$/) && method === 'PUT') {
            const userId = path.split('/')[3];
            return handleChangeGrade(env, request, userId);
        }

        if (path.match(/^\/api\/users\/\d+\/password$/) && method === 'PUT') {
            const userId = path.split('/')[3];
            return handleChangePassword(env, request, userId);
        }

        if (path.match(/^\/api\/users\/\d+$/) && method === 'DELETE') {
            const userId = path.split('/')[3];
            return handleDeleteUser(env, userId);
        }

        if (path === '/api/reports' && method === 'GET') {
            return handleGetReports(env);
        }

        if (path === '/api/reports' && method === 'POST') {
            return handleCreateReport(env, request);
        }

        if (path.match(/^\/api\/reports\/\d+$/) && method === 'DELETE') {
            const reportId = path.split('/')[3];
            return handleDeleteReport(env, reportId);
        }

        // Route non trouvée
        return jsonResponse({ error: 'Route non trouvée' }, 404);
    }
};
