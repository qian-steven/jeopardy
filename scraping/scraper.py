from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.firefox.options import Options as FirefoxOptions
import re
import time
import datetime
import json
from random import randrange

def main():
    all_questions = get_current_json()

    max_num = 7604
    driver = setup_driver()
    
    for x in range(3701,max_num):
        all_questions.extend(parse_game(x, driver))
        if x % 100 == 0:
            print(f"Finished: {x}/{max_num}")
            save_to_json(all_questions)
    
    save_to_json(all_questions)
    close_driver(driver)

def get_current_json():
    already_parsed = []
    try:
        with open('./jeopardy_data.json') as json_file:
            already_parsed = json.load(json_file)
    except:
        pass
    return already_parsed

def save_to_json(all_questions):
    with open('./jeopardy_data.json', 'w') as fp:
        json.dump(all_questions, fp)

def parse_game(game_id, driver):
    page_url = f"https://j-archive.com/showgame.php?game_id={game_id}"
    page_html = get_html_from_url(page_url, driver)
    #print(page_html)
    soup = BeautifulSoup(page_html, 'html.parser')

    game_title = soup.find("div", attrs={"id":"game_title"}).getText()

    game_questions = []

    try:
        air_date = game_title.split(" - ")[1]
        show_number = game_title.split(" - ")[0][6:]
        if int(show_number) < 2000:
            return []
        
        # Single Jeopardy
        jeopardy_table = soup.find("div", attrs={"id":"jeopardy_round"})
        categories = re.findall('<td class="category_name">(.*)</td>', str(jeopardy_table.contents))
        category_comments = re.findall('<td class="category_comments">(.*)</td>', str(jeopardy_table.contents))
        for i in range(1,7):
            for j in range(1,6):
                try:
                    clue_td = jeopardy_table.find("td", attrs={"id":f"clue_J_{i}_{j}"})
                    clue_text = ''.join([str(a) for a in clue_td.contents])
                    response_text = re.findall('<em class="correct_response">(.*)</em>', clue_td.findParent().findParent().find("div").attrs['onmouseover'])[0]
                    value = "$" + str(j*200)
                    category = categories[i-1]
                    category_comment = category_comments[i-1]
                    clue_round = "Jeopardy!"
                    if len(clue_text) > 2 or len(response_text) > 2:
                        question_data = {"category":category, "category_comment":category_comment, "air_date":air_date, "question":clue_text, "value":value, "answer": response_text, "round":clue_round, "show_number":show_number}
                        game_questions.append(question_data)
                except:
                    continue

        # Double Jeopardy
        jeopardy_table = soup.find("div", attrs={"id":"double_jeopardy_round"})
        categories = re.findall('<td class="category_name">(.*)</td>', str(jeopardy_table.contents))
        category_comments = re.findall('<td class="category_comments">(.*)</td>', str(jeopardy_table.contents))
        for i in range(1,7):
            for j in range(1,6):
                try:
                    clue_td = jeopardy_table.find("td", attrs={"id":f"clue_DJ_{i}_{j}"})
                    clue_text = ''.join([str(a) for a in clue_td.contents])
                    response_text = re.findall('<em class="correct_response">(.*)</em>', clue_td.findParent().findParent().find("div").attrs['onmouseover'])[0]
                    value = "$" + str(j*400)
                    category = categories[i-1]
                    category_comment = category_comments[i-1]
                    clue_round = "Double Jeopardy!"
                    if len(clue_text) > 2 or len(response_text) > 2:
                        question_data = {"category":category, "category_comment":category_comment, "air_date":air_date, "question":clue_text, "value":value, "answer": response_text, "round":clue_round, "show_number":show_number}
                        game_questions.append(question_data)
                except:
                    continue
        return game_questions

    except:
        print(f"couldn't get game with game_id={game_id}")
        return []

    
def get_html_from_url(page_url, driver):
    driver.get(page_url)
    time.sleep(0.5)
    page_source = driver.page_source
    return page_source

def setup_driver():
    options = FirefoxOptions()
    options.add_argument("--headless")
    options.add_argument("--window-size=1920,1200")
    driver = webdriver.Firefox(options=options)
    return driver

def close_driver(driver):
    driver.close()
    driver.quit()
    

if __name__ == "__main__":
    main()