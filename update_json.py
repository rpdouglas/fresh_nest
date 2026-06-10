import json

a11y_en = {
  "navMain": "Main navigation",
  "homeLink": "Fresh Nest Co. — Home",
  "callUs": "Call Fresh Nest Co. at {{phone}}",
  "navMobile": "Mobile navigation",
  "footerServices": "Footer services links",
  "footerLocations": "Footer service areas links",
  "footerCompany": "Footer company links"
}

a11y_fr = {
  "navMain": "Navigation principale",
  "homeLink": "Fresh Nest Co. — Accueil",
  "callUs": "Appelez Fresh Nest Co. au {{phone}}",
  "navMobile": "Navigation mobile",
  "footerServices": "Liens de services du pied de page",
  "footerLocations": "Liens des zones de service du pied de page",
  "footerCompany": "Liens de l'entreprise du pied de page"
}

def update_json(filepath, a11y_data):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data['a11y'] = a11y_data
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

update_json('/workspaces/fresh_nest/src/i18n/locales/en.json', a11y_en)
update_json('/workspaces/fresh_nest/src/i18n/locales/fr.json', a11y_fr)
print("Updated JSON files")
