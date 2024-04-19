# jeopardy

Instructions (Mac, may require slight deviations for other OS):

The game runs on the local network and should be hosted from a computer on the local network. Once the game has been started on the host computer, the board and player buzzers can then be accessed via web browser. I always use the same computer to host and display the game board, then ask participants to access buzzers via phone browsers.

0. You must have python3 installed on the host computer. python3 must have "websockets" installed; Once python3 is installed, you can install "websockets" by running "pip3 install websockets".

1. Double Click on "jeopardy" (in this same folder) to start running the game. 

Note: if you're on Mac and you get an error about an unidentified developer, you can instead right-click on "jeopardy", select "Open With"->"Terminal". Once you've done this once, MacOS should subsequently allow double-clicking.

2. Find the (local) name or IP address of the computer you're hosting the game on. The IP address can be found on Mac by going to "System Preferences"->"Network". The IP address will start with "192.168". If you know your computer name, you may be able to instead use <COMPUTER_NAME>.local. For example, my computer is named "emperor", so use http://emperor.local

3. The jeopardy board can be accessed via browser on any device (including hosting computer) on the local network at <IP_ADDRESS/LOCAL_ADDRESS>. If you are using Safari, you can make the browser fullscreen by clicking the green button in top-left (menubar). You can then toggle "View"->"Always show toolbar in fullscreen". 

NOTE - DO NOT TRY TO LOAD GAME BOARD ON MULTIPLE DEVICES/BROWSERS/WINDOWS - THIS MAY CAUSE THE GAME TO NOT WORK PROPERLY. If you do this by accident, stop the game (step 9) and start over (step 1).

4. The buzzers can be accessed by any phone on the local network at <IP_ADDRESS/LOCAL_ADDRESS>/buzzer

5. Once you can load the game board and players can load buzzers, initiate a game. Scroll down on the game board page. Enter the game number and then load questions - choose a number between 2500 and 8773, bigger numbers are more recent, game numbers correspond to those found on j-archive.com. Enter player names and click "Update Players and Reset Scores" - scores default to zero.

6. Each player should select their name from dropdown on buzzer page.

7. To play the game, click on questions on the board, players should click on red button to buzz in. One person needs to be the host and click on questions and manage game, but that person should be able to play as well.

8. To switch to "Double Jeopardy", check "Double Jeopardy" box and reload questions. Players/scores will be retained unless you click the score reset button.

9. To stop the game, close the window that opened when you launched the application.

----

To play more recent dates, you can try rerunning the scraping script... This will take time, although you could edit script to only scrape recent games.
