# Créer la structure du projet
mkdir -p identity-provider/src/main/java/com/idp/{config,controller,dto,entity,repository,service,filter}
mkdir -p identity-provider/src/main/resources

# Fichiers principaux
touch identity-provider/pom.xml
touch identity-provider/src/main/resources/application.properties
touch identity-provider/src/main/resources/firebase-service-account.json

# Fichiers Java
touch identity-provider/src/main/java/com/idp/IdentityProviderApplication.java
touch identity-provider/src/main/java/com/idp/config/{SecurityConfig,FirebaseConfig,JwtConfig}.java
touch identity-provider/src/main/java/com/idp/controller/{AuthController,UserController}.java
touch identity-provider/src/main/java/com/idp/dto/{ApiResponse,AuthRequest,UserRequest}.java
touch identity-provider/src/main/java/com/idp/entity/{User,UserSession,LoginAttempt,SecuritySetting}.java
touch identity-provider/src/main/java/com/idp/repository/{UserRepository,UserSessionRepository,LoginAttemptRepository,SecuritySettingRepository}.java
touch identity-provider/src/main/java/com/idp/service/{AuthService,JwtService,SyncService}.java
touch identity-provider/src/main/java/com/idp/filter/JwtAuthenticationFilter.java