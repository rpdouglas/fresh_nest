import json

cookie_en = {
  "preferences": "Cookie Preferences"
}

cookie_fr = {
  "preferences": "Préférences de cookies"
}

def add_cookie_translation(filepath, data):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = json.load(f)
    content['cookieBanner']['preferences'] = data['preferences']
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(content, f, indent=2, ensure_ascii=False)
        f.write('\n')

add_cookie_translation('/workspaces/fresh_nest/src/i18n/locales/en.json', cookie_en)
add_cookie_translation('/workspaces/fresh_nest/src/i18n/locales/fr.json', cookie_fr)
print("Updated translations for Cookie Preferences")
