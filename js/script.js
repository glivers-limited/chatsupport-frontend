(function(){
	//global variables
	var env,
		port, 
		host, 
		protocol, 
		baseUrl, 
		screenHeight = $(window).height(), 
		screenWidth = $(window).width(), 
		isLogined = false, 
		user = new Object(),
		signUpTimeOut,
		loginTimeOut,
		socket,
		newMessageCount = 0;
	//loading setting file
	var setting = $.getJSON( "js/setting.json");
	setting.done(function(data) {
  		env = data.env || "dev";
  		port = data[env].port || 3000;
  		host = data[env].host || "127.0.0.1";
  		protocol = data[env].protocol || "http";
  		baseUrl = protocol + "://" + host + ":" + port;
  		socket = io.connect(baseUrl);
  		isUserLogined();
  		socket.on('conversation private post', function(data) {
		    //display data.message
		    if($("#chat-bar").css("bottom") == "0px") {
		    	newMessageCount += 1;
		    	$(".new-message-count").text(newMessageCount + " new message");
		    }
		    $(".old-clat").append("<li style='height:30px;'><span class='server-message'>"+data.message+"</span></li>");
		    // if($(".old-clat").parent().height() > $(".old-clat").height())
		    // 	$(".old-clat").css("top",$(".old-clat").parent().height() - $(".old-clat").height());
		});
	});
	
	setting.fail(function() {
	    alert("please try again, chat feature not available.");
	});

	function setChatWindow() {
		if(isLogined) {
			newMessageCount = 0;
			$(".new-message-count").text('');
			$("#chat-bar").animate({"bottom": "-=375px" }, "normal" );
			$("#chat-loginbox").animate({"bottom": "-=375px" }, "normal" );
			$(".chat-user-name").text(user.fname + " " + user.lname);
			$("#chat-box").animate({"bottom": "0px" }, "normal" );
			$("#gliver-new-message").keydown(function (e) {
              if (e.keyCode == 13 && $(this).val() != '') {
                socket.emit('send message', {message:$(this).val(), id:user._id});
                $(".old-clat").append("<li style='height:30px;'><span class='my-message'>"+$(this).val()+"</span></li>");
                $(this).val('');
              }
            });
		} else {
			$("#chat-bar").animate({"bottom": "-=375px" }, "normal" );
			$("#chat-signupbox").animate({"bottom": "-=475px" }, "normal" );
			$("#chat-loginbox").animate({"bottom": "0px" }, "normal" );
		}
	}

	function hideChatWindow () {
		// body...
		$("#chat-box").animate({"bottom": "-=375px" }, "normal" );
		$("#chat-bar").animate({"bottom": "0px" }, "normal" );
	}

	function showSignUp() {
		if(isLogined) {
			setChatWindow();
		} else {
			$("#chat-bar").animate({"bottom": "-=375px" }, "normal" );
			$("#chat-loginbox").animate({"bottom": "-=375px" }, "normal" );
			$("#chat-signupbox").animate({"bottom": "0px" }, "normal" );
		}
	}

	function showChatBar() {
		$(".new-message-count").text('');
		$("#chat-loginbox").animate({"bottom": "-=375px" }, "normal" );
		$("#chat-signupbox").animate({"bottom": "-=475px" }, "normal" );
		$("#chat-box").animate({"bottom": "-=375px" }, "normal" );
		$("#chat-bar").animate({"bottom": "0px" }, "normal" );
	}

	function initSocket() {
		socket.emit('subscribe', user);

		// socket.emit('send message', {
		//     room: conversation_id,
		//     message: "Some message"
		// });

		// socket.on('conversation private post', function(data) {
		//     //display data.message
		//     console.log(data.message);
		// });
		// socket.on("private", function(message) {
		// 	console.log(message);
		// });
	}

	function isUserLogined() {
		$.ajax({
			method: "GET",
			dataType: "json",
		  	url: baseUrl + "/users/isLogined",
		  	xhrFields: {
		       withCredentials: true
		    },
		    crossDomain: true,
		  	success: function (data) {
		  		if(data.isLogined) {
		  			user = data.user;
		  			isLogined = true;
		  			initSocket();
		  		} else {
		  			isLogined = false;
		  		}
		  	},
		  	error: function (error) {
		  		console.log(error);
		  	}
		});
	}

	function setMessageLoginBox (message, cssClass) {
		// body...
		clearTimeout(loginTimeOut);
		$("#login-alert").removeClass("alert-danger").removeClass("alert-success").text(message).addClass(cssClass).fadeIn("slow");
		loginTimeOut = setTimeout(function () {
			$("#login-alert").text(message).fadeOut("slow");
		}, 5000);
	}

	function setMessageInSignUpBox (message, cssClass) {
		// body...
		clearTimeout(signUpTimeOut);
		$("#signup-alert").removeClass("alert-danger").removeClass("alert-success").text(message).addClass(cssClass).fadeIn("slow");
		signUpTimeOut = setTimeout(function () {
			$("#signup-alert").text(message).fadeOut("slow");
		}, 5000);
	}

	//login
	function chatLogin (formData) {
		// body...
		$.ajax({
			method: "POST",
		  	dataType: "json",
		  	url: baseUrl + "/users/login",
		  	data: formData,
		  	xhrFields: {
		       withCredentials: true
		    },
		    crossDomain: true,
		  	success: function (data) {
	  			// body...
	  			if(data.success) {
	  				isLogined = true;
	  				user = data.user;
	  				setChatWindow();
	  				initSocket();
	  			}
		  		else setMessageLoginBox(data.err);
		  	}
		});
	}

	//signup
	function chatSignUp (formData) {
		// body...
		var password = $("#chat-signup-password").val();
		var cPassword = $("#chat-signup-confirm-password").val();
		if(password !== cPassword) {
			alert("Please confirm password");
			return;
		}
		setMessageInSignUpBox("Please wait..", "alert-info");
		$.ajax({
			method: "POST",
		  	dataType: "json",
		  	url: baseUrl + "/users/create",
		  	data: formData,
		  	success: function (data) {
	  			// body...
		  		if(data.success) {
		  			$("#chat-login-link").click();
		  		} else {
		  			setMessageInSignUpBox(data.err, "alert-danger");
		  		}
		  	}
		});
	}

	//event handlers
	$("#loginForm").submit(function(){chatLogin($(this).serialize());});
	$("#signUpForm").submit(function(){chatSignUp($(this).serialize());});
	$("#chat-bar-icon, #chat-login-link").on("click", function(){setChatWindow();});
	$("#chat-signup-link").on("click", function(){showSignUp();});
	$("#chat-signupbox-icon, #chat-loginbox-icon, #chat-box-icon").on("click", function(){showChatBar();});
	//$("#chat-box-icon").on("click", function () {hideChatWindow();});
}());