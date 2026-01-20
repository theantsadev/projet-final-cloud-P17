package com.idp.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FirebaseAdminService {

    @Autowired
    private FirebaseAuth firebaseAuth;

    public void updateUserEmail(String uid, String newEmail) throws FirebaseAuthException {
        System.out.println("FIREBASE ADMIN: Updating email for UID: " + uid);
        System.out.println("New email: " + newEmail);

        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid)
                .setEmail(newEmail);

        UserRecord userRecord = firebaseAuth.updateUser(request);
        System.out.println("FIREBASE ADMIN: Email updated successfully!");
        System.out.println("User record: " + userRecord.getEmail() + ", " + userRecord.getUid());
    }

    public void updateUserDisplayName(String uid, String displayName) throws FirebaseAuthException {
        System.out.println("FIREBASE ADMIN: Updating display name for UID: " + uid);
        System.out.println("New display name: " + displayName);

        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid)
                .setDisplayName(displayName);

        UserRecord userRecord = firebaseAuth.updateUser(request);
        System.out.println("FIREBASE ADMIN: Display name updated successfully!");
        System.out.println("User record: " + userRecord.getDisplayName());
    }

    public void updateUser(String uid, String email, String displayName) throws FirebaseAuthException {
        System.out.println("FIREBASE ADMIN: Updating user: " + uid);

        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid);

        if (email != null && !email.trim().isEmpty()) {
            request.setEmail(email);
            System.out.println("Setting email to: " + email);
        }

        if (displayName != null && !displayName.trim().isEmpty()) {
            request.setDisplayName(displayName);
            System.out.println("Setting display name to: " + displayName);
        }

        UserRecord userRecord = firebaseAuth.updateUser(request);
        System.out.println("FIREBASE ADMIN: User updated successfully!");
        System.out.println("Result: Email=" + userRecord.getEmail() + ", Name=" + userRecord.getDisplayName());
    }

    public UserRecord getUserByUid(String uid) throws FirebaseAuthException {
        return firebaseAuth.getUser(uid);
    }

    public UserRecord getUserByEmail(String email) throws FirebaseAuthException {
        return firebaseAuth.getUserByEmail(email);
    }

    public void disableUser(String uid) throws FirebaseAuthException {
        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid)
                .setDisabled(true);
        firebaseAuth.updateUser(request);
        System.out.println("FIREBASE ADMIN: User disabled: " + uid);
    }

    public void enableUser(String uid) throws FirebaseAuthException {
        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid)
                .setDisabled(false);
        firebaseAuth.updateUser(request);
        System.out.println("FIREBASE ADMIN: User enabled: " + uid);
    }

    public void deleteUser(String uid) throws FirebaseAuthException {
        firebaseAuth.deleteUser(uid);
        System.out.println("FIREBASE ADMIN: User deleted: " + uid);
    }
}