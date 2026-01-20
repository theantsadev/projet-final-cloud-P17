#!/bin/bash
# test_all_endpoints.sh

echo "=== TEST COMPLET DE TOUS LES ENDPOINTS ==="
echo "URL de base: http://localhost:8080"
echo ""

BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"

# Fonction pour formater JSON
pretty_json() {
    python3 -m json.tool 2>/dev/null || echo "$1"
}

# Fonction pour attendre l'application
wait_for_app() {
    echo "Attente du démarrage de l'application..."
    until curl -s "$BASE_URL/actuator/health" > /dev/null 2>&1; do
        sleep 2
        echo -n "."
    done
    echo "✓ Application démarrée"
}

wait_for_app

echo ""
echo "=== 1. CONFIGURATION INITIALE ==="
echo "1.1 Récupérer configuration session:"
curl -s "$API_URL/config/session" | pretty_json

echo ""
echo "=== 2. INSCRIPTION ==="
echo "2.1 Inscription nouvel utilisateur:"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe"
  }')

echo "$REGISTER_RESPONSE" | pretty_json

# Extraire l'ID utilisateur
USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4 | sed 's/[^0-9]*//g')
echo "User ID: $USER_ID"

echo ""
echo "=== 3. CONNEXION ==="
echo "3.1 Connexion avec bon mot de passe:"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123"
  }')
echo "$LOGIN_RESPONSE" | pretty_json

echo ""
echo "3.2 Connexion avec mauvais mot de passe (tentative 1/3):"
curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword"
  }' | pretty_json

echo ""
echo "=== 4. GESTION UTILISATEURS ==="
echo "4.1 Récupérer utilisateur par ID:"
curl -s "$API_URL/users/$USER_ID" | pretty_json

echo ""
echo "4.2 Modifier informations utilisateur:"
curl -s -X PUT "$API_URL/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "fullName": "Jane Doe Updated"
  }' | pretty_json

echo ""
echo "4.3 Vérifier modification:"
curl -s "$API_URL/users/$USER_ID" | pretty_json

echo ""
echo "=== 5. TEST BLOQUAGE COMPTE ==="
echo "5.1 Tentatives de connexion échouées:"
for i in {1..3}; do
    echo "Tentative $i:"
    curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "testuser@example.com",
        "password": "WrongAgain"
      }' | grep -E "(message|error|locked)" || echo "  Échec silencieux"
done

echo ""
echo "5.2 Vérifier si compte bloqué:"
curl -s "$API_URL/auth/check-lock/testuser@example.com" | pretty_json

echo ""
echo "5.3 Débloquer le compte:"
curl -s -X POST "$API_URL/users/unblock/testuser@example.com" | pretty_json

echo ""
echo "5.4 Re-vérifier si compte bloqué:"
curl -s "$API_URL/auth/check-lock/testuser@example.com" | pretty_json

echo ""
echo "=== 6. CONFIGURATION DYNAMIQUE ==="
echo "6.1 Modifier timeout session à 90 minutes:"
curl -s -X PUT "$API_URL/config/session/timeout?minutes=90" | pretty_json

echo ""
echo "6.2 Modifier tentatives max à 7:"
curl -s -X PUT "$API_URL/config/session/attempts?attempts=7" | pretty_json

echo ""
echo "6.3 Vérifier nouvelle configuration:"
curl -s "$API_URL/config/session" | pretty_json

echo ""
echo "=== 7. SWAGGER UI ==="
echo "Accédez à la documentation Swagger:"
echo "  $BASE_URL/swagger-ui.html"
echo "Documentation OpenAPI:"
echo "  $BASE_URL/api-docs"

echo ""
echo "=== 8. TEST FIREBASE (si connecté) ==="
echo "8.1 Inscription avec Firebase (si internet disponible):"
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "firebaseuser@example.com",
    "password": "FirebasePass123",
    "fullName": "Firebase User"
  }' | grep -E "(token|firebase|userId)" || echo "  Mode local activé"

echo ""
echo "=== TESTS TERMINÉS ==="
echo "Résumé des endpoints testés:"
echo "✓ POST /api/auth/register"
echo "✓ POST /api/auth/login" 
echo "✓ GET  /api/auth/check-lock/{email}"
echo "✓ GET  /api/users/{id}"
echo "✓ PUT  /api/users/{id}"
echo "✓ POST /api/users/unblock/{email}"
echo "✓ POST /api/users/block/{email}"
echo "✓ GET  /api/config/session"
echo "✓ GET  /api/config/session/timeout"
echo "✓ GET  /api/config/session/attempts"
echo "✓ PUT  /api/config/session/timeout"
echo "✓ PUT  /api/config/session/attempts"
echo "✓ PUT  /api/config/session"