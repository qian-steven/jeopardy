// jeopardy homepage JS code

    // Initialize jeopardy mode and null game selection
    var double_jeopardy = false;
    var game_number = -1;

    // Clue Modal Elements
    var modal_clue_link = document.getElementById("modal_clue"); // clue
    var response_visible_toggle_link = document.getElementById("response_visible_toggle"); // show answer button
    var response_text_link = document.getElementById("question_response"); // answer
    var player_point_select_toggle_link = document.getElementById("question_response_player_select_toggle"); // player

    // Players and scores
    var player_names = [];
    var player_scores = [];

    // Initialize clue/answer arrays
    var question_clues = [[],[],[],[],[],[]];
    var question_responses = [[],[],[],[],[],[]];

    // Initialize value of current score
    var current_question_weight = 0;

    // Websocket initialization on localhost port 8001
    var server_ip_address = window.location.href.replace("http://","").replace("https://","").split(":")[0].split("/")[0];
    var buzzer_socket = new WebSocket("ws://"+server_ip_address+":8001");

    // Time to buzz/answer default values - can be changed
    var time_to_buzz = 16;
    var time_to_answer = 6;

    // TODO: Not sure what these variables do yet
    var circle_timer_lock_held = false;
    var circle_timer_lock_should_release = false;
    var show_player_select_for_points = true;

    var player_with_last_correct_response = -1;

    // Fetch all json data
    // jeopardy_data.json contains all the available clues prescraped
    var json_data;
    fetch("./jeopardy_data.json")
    .then(response => response.json())
    .then(json => json_data = json);

    // Set this when the response for the current clue should become visible; or if the clue is getting closed out
    function setClueResponseVisible() {
        buzzer_socket.send("disallow_buzzes:"); // TODO: This may throw an error message
        response_visible_toggle_link.style.visibility = "visible";
        if (show_player_select_for_points) {
            player_point_select_toggle_link.style.visibility = "visible";
        }
        if (circle_timer_lock_held) {
            circle_timer_lock_should_release = true;
        }
    }

    // Called when a clue with specified row/column has been clicked
    function clickClue(row, col) {
        var button_link = document.getElementById("button_r"+row+"c"+col);
        button_link.style.visibility = "hidden"; // Hide the row/column of the clue when clicked

        //modal_clue_link.innerHTML = "'The shorter glass seen <a href=\"http://www.j-archive.com/media/2004-12-31_DJ_12.jpg\" target=\"_blank\">here</a>, or a quaint cocktail mad…. clue r" + row + "c" + col;
        modal_clue_link.innerHTML = question_clues[col][row];
        response_text_link.innerHTML = question_responses[col][row];
        player_point_select_toggle_link.style.visibility = "hidden";
        response_visible_toggle_link.style.visibility = "hidden";
        show_player_select_for_points = false;

        document.getElementById("question_title").innerHTML = categories[col] + " - " + document.getElementById("button_r"+row+"c"+col).innerHTML;

        current_question_weight = 200+200*row;
        if (double_jeopardy) {
            current_question_weight = current_question_weight * 2;
        }

        // Show clue and allow buzzer input
        // TODO: Account for latency
        $('#clueModal').modal('show');
        buzzer_socket.send("allow_buzzes:");
        document.getElementById("buzzer_indicator").innerHTML = "";
        start_circle_timer(time_to_buzz, "buzz_in_timer");
    }

    // This should be called when you want to reset player names and scores
    function set_players() {
        player_names = [];
        player_scores = [];

        // Get player names
        for (var i=0; i<6; i++) {
            var player_name_input_link = document.getElementById("player"+i+"_name_input");
            var player_score_input_link = document.getElementById("player"+i+"_score_input");
            player_name_input = player_name_input_link.value; 
            if (player_name_input != "") {
                player_names.push(player_name_input);
                player_score_input = parseInt(player_score_input_link.value);
                if (isNaN(player_score_input)) {
                    player_score_input = 0;
                }
                player_scores.push(player_score_input);
            }
        }

        // Reset player info boxes (bottom of screen)
        var player_info_link = document.getElementById("players_info_table_row");
        while (player_info_link.firstChild) {
            player_info_link.removeChild(player_info_link.firstChild);
        }
        player_names.forEach (function(value, index) {
            var player_node = document.createElement("th");
            player_node.scope = "col";
            player_node.id = "player"+index+"_div";
            var player_name_node = document.createElement("p");
            player_name_node.id = "player"+index+"_name";
            player_name_node.innerHTML = value;
            player_name_node.style.fontSize = "1.6vw";
            var player_score_node = document.createElement("p");
            player_score_node.id = "player"+index+"_score";
            player_score_node.innerHTML = player_scores[index];
            player_score_node.style.fontSize = "1.6vw";
            player_node.appendChild(player_name_node);
            player_node.appendChild(player_score_node);
            player_info_link.appendChild(player_node);
        });

        // Reset players to select for point increase/decrease in modal
        var player_point_select_link = document.getElementById("player_point_select");
        while (player_point_select_link.firstChild) {
            player_point_select_link.removeChild(player_point_select_link.firstChild);
        }
        player_names.forEach (function(value, index) {
            var option_node = document.createElement("option");
            option_node.id = "player"+index+"_select";
            option_node.value = index;
            option_node.innerHTML = value;
            player_point_select_link.appendChild(option_node);
        });
        buzzer_socket.send("announce_players:"+player_names.join(","));
        player_with_last_correct_response = -1;
    }

    // timer function
    function start_circle_timer(time_duration, timer_type = "") {
        if(circle_timer_lock_held) {
            circle_timer_lock_should_release = true;
            setTimeout(() => {
                start_circle_timer(time_duration);
            }, 10);
        } else {
            console.log("new circle timer...");
            circle_timer_lock_held = true;
            circle_timer_path = document.getElementById("circle_timer");
            circle_timer_path.style.strokeDashoffset = "126%";
            circle_timer_path.style.strokeDasharray = "126%";
            circle_timer_path.style.stroke = "lightGreen";
            circle_timer_path.style.fill = "white";

            var progress = 0.0;
            var refresh_per_second = 100;

            var circle_timer_interval_id = setInterval(function() {
                if (circle_timer_lock_should_release) {
                    console.log("releasing circle timer lock");
                    circle_timer_lock_held = false;
                    circle_timer_lock_should_release = false;
                    clearInterval(circle_timer_interval_id);
                    return;
                }
                progress += 1/refresh_per_second/time_duration;
                if (progress >= 1) {
                    circle_timer_lock_should_release = true;
                    buzzer_socket.send("disallow_buzzes:");
                    circle_timer_path.style.fill = "rgb(255,20,20)";
                    if (timer_type == "buzz_in_timer"){
                        setClueResponseVisible();
                    }
                } else {
                    circle_timer_path.style.strokeDashoffset = (126 - progress*126) + "%";
                    const green_color = Math.min(255, 600-(progress)*580);
                    const blue_color = 20;
                    const red_color = Math.min(255, 20+progress*410);
                    circle_timer_path.style.stroke = "rgb("+red_color+","+green_color+","+blue_color+")";
                }
            }, 1000/refresh_per_second);
        }
    }

    // this is called whenever the timer sliders are changed
    function update_timer_values() {
        document.getElementById("time_to_buzz").innerHTML =  document.getElementById("time_to_buzz_slider").value;
        document.getElementById("time_to_answer").innerHTML =  document.getElementById("time_to_answer_slider").value;
        time_to_buzz = parseInt(document.getElementById("time_to_buzz_slider").value);
        time_to_answer = parseInt(document.getElementById("time_to_answer_slider").value);
    }

    // this is called when the "+" or "-" is clicked to indicate a correct or incorrect response
    function update_score(response_correct) {
        var selected_player = document.getElementById("player_point_select").value;
        if (response_correct) {
            player_scores[selected_player] += current_question_weight;
            player_with_last_correct_response = selected_player;
        } else {
            player_scores[selected_player] -= current_question_weight;
        }
        document.getElementById("player"+selected_player+"_score").innerHTML = player_scores[selected_player];
        $('#clueModal').modal('hide');
    }

    // this is called when you click on the "load questions" button. parses the question data from the local data
    function load_data_from_options() {
        double_jeopardy = document.getElementById("double_jeopardy_checkbox").checked;
        game_number = parseInt(document.getElementById("show_number").value);
        filtered_data = [];
        categories = [];
        category_comments = [];

        // Filter Data, Find Categories
        json_data.forEach(function(data, index) {
            if (game_number == data["show_number"] && !data["question"].includes("j-archive.com") && ((!double_jeopardy && data["round"]=="Jeopardy!") || (double_jeopardy && data["round"]=="Double Jeopardy!"))){
                if (data["question"].includes("j-archive.com")){
                    /*if (data["question"].includes(".jpg") || data["question"].includes(".png")){
                        data["question"] = data["question"].replace('<a', '<img').replace('</a>', '').replace('href', 'src');
                        filtered_data.push(data);
                        if (!categories.includes(data["category"])){
                            categories.push(data["category"]);
                        }
                    }
                    else if (data["question"].includes(".mp3")){

                        console.log(data["question"]);
                        console.log(data["category"] + "  " + data["value"]);
                        data["question"] = data["question"].replace('>', '> ').replace('<a href=', '<audio controls><source src=').replace('</a> ', '').replace('> ', ' type="audio/mpeg">Your browser does not support the audio element.</audio><br>');
                        filtered_data.push(data);
                        if (!categories.includes(data["category"])){
                            categories.push(data["category"]);
                        }
                        console.log(data["question"]);
                        console.log(data["category"] + "  " + data["value"]);
                    }
                    else {
                        console.log(data["question"]);
                    }*/
                } else {
                    data['answer'] = data['answer'].replace("\\'","'");
                    filtered_data.push(data);
                    if (!categories.includes(data["category"])){
                        categories.push(data["category"]);
                        category_comments.push(data["category_comment"])
                    }
                }
                
            }
        });
        while (categories.length < 6) {
            categories.push("---");
            category_comments.push("");
        }

        for (var i=0; i<6; i++) {
            for (var j=0; j<5; j++) {
                document.getElementById("button_r"+j+"c"+i).style.visibility = "hidden";
            }
        }
        
        filtered_data.forEach(function(data, index) {
            var q_col = categories.indexOf(data["category"]);
            var q_row = parseInt(data["value"].substring(1,data["value"].length));
            if (double_jeopardy) {
                q_row = q_row/2;
            }
            q_row = q_row/200 - 1;

            if (q_col >= 0 && [0,1,2,3,4].includes(q_row)) {
                question_clues[q_col][q_row] = data["question"];
                question_responses[q_col][q_row] = data["answer"];
                document.getElementById("button_r"+q_row+"c"+q_col).style.visibility = "visible";
                document.getElementById("button_r"+q_row+"c"+q_col).innerHTML = data["value"];
            }
        });

        for (var i=0; i<6; i++) {
            document.getElementById("category"+i).innerHTML = categories[i];
            document.getElementById("category_comment"+i).innerHTML = category_comments[i];
        }
        document.getElementById("game_date_info").innerHTML = "Game air date : " + filtered_data[0]["air_date"];
    }

    // this function defines what we do when we receive a websocket event
    // currently, we only do anything if there has been a buzz from a player
    buzzer_socket.onmessage = function (event) {
        var socket_message = event.data;
        if (socket_message.split(":").length != 2) {
            return;
        }
        var message_type = socket_message.split(":")[0];
        var message_content = socket_message.split(":")[1];
        console.log(message_type)
        console.log(message_content)
        if (message_type == "buzz") {
            var player_buzz = message_content;
            if (player_names.includes(player_buzz)) {
                document.getElementById("buzzer_indicator").innerHTML = player_buzz + " buzzed in first!";
                document.getElementById("player_point_select").value = player_names.indexOf(player_buzz);
                show_player_select_for_points = true;
                buzzer_socket.send("disallow_buzzes:");
                start_circle_timer(time_to_answer);
            }
        }
    }

    // this function defines what we do when we open the websocket
    buzzer_socket.onopen = function () {
        // Don't call set_players() - if index.html is opened in a new window, we don't want to interrupt the game
    }