const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = "Av98012@12";

// Store admin sessions
const sessions = new Set();

// ============================================================
//  SEND RESPONSE HELPER
// ============================================================
function send(res, status, body) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end(JSON.stringify(body));
}

// ============================================================
//  REQUEST HANDLER
// ============================================================
async function requestHandler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method;

    console.log(`📡 ${method} ${url.pathname}`);

    // Handle CORS preflight
    if (method === "OPTIONS") {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        });
        res.end();
        return;
    }

    // ============================================================
    //  ROOT ROUTE - Test if server is working
    // ============================================================
    if (method === "GET" && url.pathname === "/") {
        send(res, 200, {
            status: "ok",
            message: "Vusani Ikhaya Backend is running!",
            routes: ["/api/health", "/api/public", "/api/admin/login", "/api/admin/data"]
        });
        return;
    }

    // ============================================================
    //  HEALTH CHECK - /api/health
    // ============================================================
    if (method === "GET" && url.pathname === "/api/health") {
        send(res, 200, {
            status: "ok",
            message: "Server is running!",
            timestamp: new Date().toISOString()
        });
        return;
    }

    // ============================================================
    //  PUBLIC API - /api/public
    // ============================================================
    if (method === "GET" && url.pathname === "/api/public") {
        send(res, 200, {
            rooms: [],
            reviews: [],
            transports: []
        });
        return;
    }

    // ============================================================
    //  ADMIN LOGIN - /api/admin/login
    // ============================================================
    if (method === "POST" && url.pathname === "/api/admin/login") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                if (data.password === ADMIN_PASSWORD) {
                    const token = crypto.randomBytes(24).toString("hex");
                    sessions.add(token);
                    send(res, 200, { token });
                } else {
                    send(res, 401, { error: "Incorrect password" });
                }
            } catch (e) {
                send(res, 400, { error: "Invalid request" });
            }
        });
        return;
    }

    // ============================================================
    //  ADMIN DATA - /api/admin/data (Requires Token)
    // ============================================================
    if (method === "GET" && url.pathname === "/api/admin/data") {
        const auth = req.headers.authorization || "";
        const token = auth.replace("Bearer ", "");

        if (!sessions.has(token)) {
            send(res, 401, { error: "Unauthorized" });
            return;
        }

        send(res, 200, {
            rooms: { pending: [], approved: [], taken: [], declined: [], removed: [] },
            reviews: { pending: [], approved: [], declined: [] },
            reports: { pending: [], approved: [], declined: [] },
            transports: { pending: [], approved: [], declined: [], removed: [] },
            agents: { accounts: [], profiles: [], landlords: [], reports: [], leads: [], viewings: [], support: [] },
            receipts: []
        });
        return;
    }

    // ============================================================
    //  ADMIN ACTION - /api/admin/action (Requires Token)
    // ============================================================
    if (method === "POST" && url.pathname === "/api/admin/action") {
        const auth = req.headers.authorization || "";
        const token = auth.replace("Bearer ", "");

        if (!sessions.has(token)) {
            send(res, 401, { error: "Unauthorized" });
            return;
        }

        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                // Acknowledge the action
                send(res, 200, { ok: true, message: "Action received", action: data.action });
            } catch (e) {
                send(res, 400, { error: "Invalid request" });
            }
        });
        return;
    }

    // ============================================================
    //  404 - Not Found
    // ============================================================
    send(res, 404, { error: `Route ${url.pathname} not found` });
}

// ============================================================
//  START SERVER
// ============================================================
const server = http.createServer(requestHandler);

server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔑 Admin password: ${ADMIN_PASSWORD}`);
    console.log(`📡 Health: http://localhost:${PORT}/api/health`);
    console.log(`📡 Public: http://localhost:${PORT}/api/public`);
    console.log(`📡 Login: POST http://localhost:${PORT}/api/admin/login`);
});

server.on("error", (e) => {
    console.error("❌ Server error:", e);
});
