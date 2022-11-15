class Firebase {
    static firebase = null;
    static app = null;
    static db = null;
    static auth = null;
    static storage = null;
    static ui = null;
    static currentUser = {
        auth_data: null,
        custom_data: null,
    };
}

let passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$');

function initIndex() {
    if ($("#post-carousel").length <= 0) {
        return;
    }

    Firebase.db.collection('write-post').get().then((result) => {
        result.forEach((doc) => {
            let storageRef = Firebase.storage.ref();
            storageRef.child(doc.data().imagePath).getDownloadURL().then((imageUrl) => {
                let template = `
                    <div class="post">
                        <div class="post-header">
                            <div class="profile"></div>
                            <span class="profile-name">${doc.data().name}</span>
                            <button class="btn btn-light" style="float:right;" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="edit.html?id=${doc.id}">편집</a></li>
                                <li><a class="dropdown-item" href="delete.html?id=${doc.id}">삭제</a></li>
                            </ul>
                        </div>
                        <div class="post-body" style="background-image: url('${imageUrl}');"></div>
                        <div class="post-content">
                            <div class="post-content-header">
                                <div class="like">❤</div>
                                <p class="date">${doc.data().date.toDate().toLocaleString()}</p>
                            </div>
                            <div id="post-comment-${doc.id}" class="post-comment mb-3">
                            </div>
                            <div class="input-group mb-3">
                                <input id="input-comment-${doc.id}" type="text" class="form-control form-control-sm" placeholder="댓글 달기..." aria-label="댓글 달기..." aria-describedby="button-comment">
                                <button class="btn btn-sm btn-outline-secondary" type="button" id="button-comment-${doc.id}">게시</button>
                            </div>
                        </div>
                    </div>
                    `;
                $('#post-carousel').append(template);

                Firebase.db.collection('write-post').doc(doc.id).collection('comments').orderBy('date').onSnapshot((result) => {
                    $(`#post-comment-${doc.id}`).html('');
                    result.forEach((comment) => {
                        let commentTemplate = `
                            <div class="mb-1">
                                <strong>${comment.data().userName}</strong> ${comment.data().content}
                            </div>
                        `;
                        $(`#post-comment-${doc.id}`).append(commentTemplate);
                    })
                });

                $(`#button-comment-${doc.id}`).click(function () {
                    if (Firebase.currentUser.auth_data == null) {
                        window.location.href = 'sign_in.html';
                        return;
                    }

                    let comment = $(`#input-comment-${doc.id}`).val();
                    if (!comment) {
                        return;
                    }

                    let commentData = {
                        content: comment,
                        date: new Date(),
                        uid: Firebase.currentUser.auth_data.uid,
                        userName: Firebase.currentUser.custom_data.name,
                    }

                    Firebase.db.collection('write-post').doc(doc.id).collection('comments').add(commentData);
                    $(`#input-comment-${doc.id}`).val('');
                });
            });
        })
    });
}

function initComment() {

}

function initEdit() {
    if ($("#edit-title").length <= 0) {
        return;
    }

    let queryString = new URLSearchParams(window.location.search);
    let postId = queryString.get('id');

    Firebase.db.collection('write-post').doc(postId).get()
        .then((result) => {
            $('#edit-title').val(result.data().title);
            $('#edit-content').html(result.data().content);
        });
}

function initEditProfile() {
    if ($("#editprofile-submit").length <= 0) {
        return;
    }

    let queryString = new URLSearchParams(window.location.search);
    let uid = queryString.get('uid');

    Firebase.auth.onAuthStateChanged(function (user) {
        if (user) {
            $('#editprofile-email').val(user.email);
        }
    });

    Firebase.db.collection('user').doc(uid).get()
        .then((result) => {
            $('#editprofile-name').val(result.data().name);
            $('#editprofile-birthDay').val(result.data().birthDay);
            $('#editprofile-phoneNumber').val(result.data().phoneNumber);
        });
}

function initDelete() {
    if ($("#delete-post").length <= 0) {
        return;
    }

    let queryString = new URLSearchParams(window.location.search);
    let postId = queryString.get('id');

    Firebase.db.collection('write-post').doc(postId).get()
        .then((result) => {
            if (result.data().imagePath) {
                const storageRef = Firebase.storage.ref();
                var desertRef = storageRef.child(result.data().imagePath);
                desertRef.delete()
                    .then(() => {
                    })
                    .catch((error) => {
                        console.log(error);
                        alert('이미지를 삭제할 수 없습니다\n' + error.message);
                    });
            }

            Firebase.db.collection("write-post").doc(postId).delete()
                .then(() => {
                    alert("게시물이 삭제되었습니다!");
                    window.location.href = 'index.html';
                }).catch((error) => {
                    console.log(error);
                    alert("게시물을 삭제할 수 없습니다!\n" + error.message);
                    window.location.href = 'index.html';
                });
        });

}

function registerEvent() {
    $('#signup-submit').click(function () {
        signUp();
    });

    $('#signin-submit').click(function () {
        signIn();
    });

    $('#usermenuitem-signout').click(function () {
        Firebase.auth.signOut();
        window.location.href = "index.html";
    });

    $('#write-post').click(function () {
        writePost();
    });

    $('#edit-post').click(function () {
        editPost();
    });

    $('#usermenuitem-editprofile').click(function () {
        if (Firebase.currentUser.auth_data == null) {
            return;
        }
        window.location.href = `edit_profile.html?uid=${Firebase.currentUser.auth_data.uid}`;
    });

    $('#editprofile-submit').click(function () {
        editProfile();
    });

    Firebase.auth.onAuthStateChanged(function (user) {
        if (user) {
            Firebase.db
                .collection("user")
                .doc(user.uid)
                .get()
                .then((result) => {
                    if (result.data() == null) {
                        return;
                    }

                    Firebase.currentUser.auth_data = user;
                    Firebase.currentUser.custom_data = result.data();

                    $('#userName').html(result.data().name);
                    $('#userEmail').html(user.email);

                    $('#usermenu-signedout').addClass('d-none');
                    $('#usermenu-signedin').removeClass('d-none');
                });
        } else {
            Firebase.currentUser.auth_data = null;
            Firebase.currentUser.custom_data = null;

            $('#userName').html('');
            $('#userEmail').html('');

            $('#usermenu-signedout').removeClass('d-none');
            $('#usermenu-signedin').addClass('d-none');
        }
    });
}

function signIn() {
    let email = $('#signin-email').val();
    let password = $('#signin-password').val();

    Firebase.auth.signInWithEmailAndPassword(email, password)
        .then(function (response) {
            window.location.href = "index.html";
        })
        .catch(function (error) {
            console.log(error);
            alert('로그인 할 수 없습니다.\n' + error.message);
        });
}

function signUp() {
    let email = $('#signup-email').val();
    let password = $('#signup-password').val();

    if (!passwordRegex.test(password)) {
        alert('비밀번호는 알파벳 대문자와 소문자, 숫자, 특수문자로 구성된 최소 10자리 길이로 입력해주세요');
        return;
    }

    Firebase.auth.createUserWithEmailAndPassword(email, password)
        .then(function (response) {
            updateUserData(response.user);
        })
        .catch(function (error) {
            console.log(error);
            alert('회원가입을 할 수 없습니다.\n' + error.message);
        });

}

function updateUserData(user) {
    let name = $('#signup-name').val();
    let birthDay = $('#signup-birthDay').val();
    let phoneNumber = $('#signup-phoneNumber').val();

    Firebase.db
        .collection("user")
        .doc(user.uid)
        .set({
            'name': name,
            'birthDay': birthDay,
            'phoneNumber': phoneNumber,
        })
        .then(function (response) {
            window.location.href = "index.html";
        });
}

function editProfile() {
    if (Firebase.currentUser.auth_data == null) {
        return;
    }

    let queryString = new URLSearchParams(window.location.search);
    let uid = queryString.get('uid');


    Firebase.db.collection('user').doc(uid).update({
        name: $('#editprofile-name').val(),
        birthDay: $('#editprofile-birthDay').val(),
        phoneNumber: $('#editprofile-phoneNumber').val(),
    }).then((result) => {
        let newPassword = $('#editprofile-password').val();
        if (newPassword.length > 0) {
            Firebase.currentUser.auth_data.updatePassword(newPassword).then(() => {
                window.location.href = "index.html";
            }).catch((error) => {
                console.log(error);
                alert('비밀번호를 편집 할 수 없습니다\n' + error.message);
                $('#editprofile-password').focus();
            });
        } else {
            window.location.href = "index.html";
        }
    }).catch((error) => {
        console.log(error);
        alert('프로필을 편집 할 수 없습니다\n' + error.message);
    });
}

function editPost() {
    if (Firebase.currentUser.auth_data == null) {
        return;
    }

    let queryString = new URLSearchParams(window.location.search);
    let postId = queryString.get('id');

    Firebase.db.collection('write-post').doc(postId).update({
        title: $('#edit-title').val(),
        content: $('#edit-content').val(),
        date: new Date(),
    }).then((result) => {
        window.location.href = "index.html";
    }).catch((error) => {
        console.log(error);
        alert('게시글을 편집 할 수 없습니다\n' + error.message);
    });
}

function writePost() {
    if (Firebase.currentUser.auth_data == null) {
        return;
    }

    let file = $('#write-image').prop('files')[0];
    let fileId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    let filePath = `write-image/${Firebase.currentUser.auth_data.uid}/${fileId}`;
    let filePathResized = `${filePath}_450x450`;

    const storageRef = Firebase.storage.ref();
    const uploadTask = storageRef.child(filePath).put(file);
    uploadTask.on('state_changed',
        // 변화시 동작하는 함수 
        null,
        // 에러시 동작하는 함수
        (error) => {
            console.log(error);
            alert('이미지를 업로드 할 수 없습니다\n' + error.message);
        },
        // 성공시 동작하는 함수
        () => {
            Firebase.db.collection('write-post').add({
                title: $('#write-title').val(),
                content: $('#write-content').val(),
                image: filePathResized,
                imagePath: filePathResized,
                date: new Date(),
                uid: Firebase.currentUser.auth_data.uid,
                name: Firebase.currentUser.custom_data.name,
            }).then((result) => {
                window.location.href = "index.html";
            }).catch((error) => {
                console.log(error);
                alert('이미지 주소를 읽을 수 없습니다\n' + error.message);
            });
        });
}

function initGoogleLogin() {

    if (Firebase.ui == null || $('#firebaseui-auth-container').length == 0) {
        return;
    }

    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                // User successfully signed in.
                // Return type determines whether we continue the redirect automatically
                // or whether we leave that to developer to handle.

                const usersRef = Firebase.db.collection('user').doc(authResult.user.uid);
                usersRef.get()
                    .then((docSnapshot) => {
                        if (docSnapshot.exists) {
                            usersRef.onSnapshot((doc) => {
                                // do stuff with the data
                                //window.location.href = "index.html";
                            });
                        } else {
                            usersRef.set({
                                'name': authResult.user.displayName,
                                'birthDay': "",
                                'phoneNumber': "",
                            }).then((result) => {
                                //window.location.href = "index.html";
                            });
                        }
                    });

                return true;
            },
            uiShown: function () {
                // The widget is rendered.
                // Hide the loader.
                document.getElementById('loader').style.display = 'none';
            }
        },
        // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
        signInFlow: 'popup',
        signInSuccessUrl: 'index.html',
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
            // firebase.auth.GithubAuthProvider.PROVIDER_ID,
            // firebase.auth.EmailAuthProvider.PROVIDER_ID,
            // firebase.auth.PhoneAuthProvider.PROVIDER_ID
        ],
        // Terms of service url.
        //tosUrl: '<your-tos-url>',
        // Privacy policy url.
        //privacyPolicyUrl: '<your-privacy-policy-url>'
    };

    Firebase.ui.start('#firebaseui-auth-container', uiConfig);
}

document.addEventListener('DOMContentLoaded', function () {
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    // // The Firebase SDK is initialized and available here!
    //
    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.firestore().doc('/foo/bar').get().then(() => { });
    // firebase.functions().httpsCallable('yourFunction')().then(() => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
    // firebase.analytics(); // call to activate
    // firebase.analytics().logEvent('tutorial_completed');
    // firebase.performance(); // call to activate
    //
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

    try {
        Firebase.firebase = firebase;
        Firebase.app = firebase.app();
        Firebase.db = firebase.firestore();
        Firebase.auth = firebase.auth();
        Firebase.storage = firebase.storage();
        if (firebaseui) {
            Firebase.ui = new firebaseui.auth.AuthUI(Firebase.auth);
        }

        initGoogleLogin();

        registerEvent();

        initIndex();
        initEdit();
        initDelete();
        initEditProfile();

    } catch (e) {
        console.error(e);
    }
});
