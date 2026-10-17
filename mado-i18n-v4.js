/* VERSION 4 — globe icon (home + login screen)
   MADO — security fixes + Deutsch/English (additive layer)
   Loaded with: <script src="mado-i18n-v4.js"></script> in <head> of index.html (no "defer").
   1) closes the stored-XSS holes (avatar, photo paths) and the reset-link hole;
   2) translates French UI text to German/English and adds the two language
      buttons in Compte > Langue. Any failure leaves the app untouched. */
(function () {
  /* ---------- PHASE 1 — runs immediately (before the app script when loaded in <head>) ----------
     Reset-password links put the token in the URL; the app injects it into HTML unescaped.
     Anything that is not a plain JWT is dropped from the URL before the app can read it. */
  try {
    var h0 = location.hash;
    if (h0 && /type=recovery/.test(h0)) {
      var tk0 = new URLSearchParams(h0.slice(1)).get('access_token') || '';
      if (!/^[A-Za-z0-9._-]+$/.test(tk0)) history.replaceState(null, '', location.pathname + location.search);
    }
  } catch (e) {}

  function main() {
  try {
    if (typeof LG === 'undefined') return;
    var L = LG === 'de' ? 1 : LG === 'en' ? 2 : 0;

    /* ---------- 0) security fixes (all languages) ----------
       avHtml(): avatar comes from other users' profiles -> only real image data URLs are allowed.
       thumbs(): photo paths come from other users' snapshots -> only "<uuid>/<name>.jpg" is allowed. */
    try {
      var IMG = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/;
      window.avHtml = function (src, nm, sz) {
        var ok = typeof src === 'string' && IMG.test(src);
        var t = (String(nm || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2) || '?').toUpperCase();
        sz = +sz || 36;
        return '<span class="av" style="width:' + sz + 'px;height:' + sz + 'px;font-size:' + Math.round(sz / 2.6) + 'px;' +
          (ok ? "background-image:url('" + src + "')" : '') + '">' + (ok ? '' : esc(t)) + '</span>';
      };
      var PATH = /^[0-9a-f-]{36}\/[0-9a-z]+\.jpg$/i;
      window.thumbs = function (a) {
        a = (a || []).filter(function (q) { return typeof q === 'string' && PATH.test(q); });
        return a.length ? '<div class="ph">' + a.map(function (q) { return '<img data-p="' + q + '" onclick="zoom(this.src)">'; }).join('') + '</div>' : '';
      };
    } catch (e) {}

    /* ---------- 1) language buttons (always, so FR/AR users can switch) ---------- */
    var ar = document.getElementById('lg_ar'), row = ar && ar.parentNode;
    if (row) {
      row.style.flexWrap = 'wrap';
      ['lg_fr', 'lg_ar'].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.flex = '1 1 45%'; });
      [['de', 'Deutsch'], ['en', 'English']].forEach(function (p) {
        var b = document.createElement('button');
        b.className = 's'; b.id = 'lg_' + p[0]; b.textContent = p[1];
        b.style.flex = '1 1 45%'; b.style.marginTop = '8px';
        b.onclick = function () { setLg(p[0]); };
        row.appendChild(b);
      });
    }
    /* ---------- 1b) globe icon in the header + language row on the login screen ---------- */
    var LGS = [['fr', 'Français'], ['ar', 'العربية'], ['de', 'Deutsch'], ['en', 'English']];
    var menu = null;
    function closeMenu() { if (menu) menu.style.display = 'none'; }
    function lgBtn(code, name, small) {
      var b = document.createElement('button');
      b.className = 's'; b.type = 'button'; b.textContent = name; b.setAttribute('lang', code);
      if (small) { b.style.padding = '8px 4px'; b.style.fontSize = '13px'; b.style.flex = '1 1 22%'; }
      else { b.style.width = '100%'; b.style.textAlign = 'start'; b.style.padding = '10px 14px'; }
      if (LG === code) { b.style.borderColor = 'var(--a)'; b.style.color = 'var(--a)'; }
      b.onclick = function (e) { e.stopPropagation(); if (LG !== code) setLg(code); else closeMenu(); };
      return b;
    }
    var GLOBE = '<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';
    function globeBtn() {
      var g = document.createElement('button');
      g.type = 'button'; g.className = 's';
      g.setAttribute('aria-label', 'Language'); g.title = 'Language';
      g.style.cssText = 'display:flex;align-items:center;gap:4px;height:36px;padding:0 8px;border-radius:10px;font:500 11px var(--f2)';
      g.innerHTML = GLOBE + LG.toUpperCase();
      return g;
    }
    var MENU_CSS = 'display:none;flex-direction:column;gap:6px;min-width:150px;background:var(--c);border:1px solid var(--b2);border-radius:12px;padding:6px;box-shadow:0 8px 30px rgba(0,0,0,.35)';
    var hav = document.getElementById('hav');
    if (hav && hav.parentNode && !document.getElementById('lgb')) {
      var gb = globeBtn();
      gb.id = 'lgb';
      hav.parentNode.insertBefore(gb, hav);
      menu = document.createElement('div');
      menu.id = 'lgm';
      menu.style.cssText = MENU_CSS + ';position:fixed;top:calc(env(safe-area-inset-top,0px) + 58px);inset-inline-end:12px;z-index:40';
      LGS.forEach(function (p) { menu.appendChild(lgBtn(p[0], p[1], false)); });
      document.body.appendChild(menu);
      gb.onclick = function (e) { e.stopPropagation(); menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex'; };
      document.addEventListener('click', closeMenu);
    }
    /* login screen: same globe icon (top corner) that opens the language list */
    function addLoginLang() {
      var lo = document.getElementById('lo');
      if (!lo || !lo.querySelector('input') || lo.querySelector('#lglo')) return;
      var w = document.createElement('div');
      w.id = 'lglo';
      w.style.cssText = 'position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);inset-inline-end:16px;z-index:2';
      var g = globeBtn();
      var m = document.createElement('div');
      m.style.cssText = MENU_CSS + ';position:absolute;top:44px;inset-inline-end:0';
      LGS.forEach(function (p) { m.appendChild(lgBtn(p[0], p[1], false)); });
      g.onclick = function (e) { e.stopPropagation(); m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; };
      lo.addEventListener('click', function () { m.style.display = 'none'; });
      w.appendChild(g); w.appendChild(m);
      lo.appendChild(w);
    }
    addLoginLang();
    ['showLogin', 'showReset'].forEach(function (n) {
      var o = window[n];
      if (typeof o !== 'function') return;
      window[n] = function () { var x = o.apply(this, arguments); addLoginLang(); return x; };
    });

    var _th = window.thUI;
    window.thUI = function () {
      if (_th) _th();
      ['de', 'en'].forEach(function (k) {
        var b = document.getElementById('lg_' + k);
        if (b) { b.style.borderColor = LG == k ? 'var(--a)' : ''; b.style.color = LG == k ? 'var(--a)' : ''; }
      });
    };
    window.thUI();

    if (!L) return; // French / Arabic: nothing else to do

    /* dictation language follows the app language */
    window.dict = function (i) {
      var R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) { tst('Dictée non supportée : utilisez le micro du clavier'); return; }
      var r = new R();
      r.lang = LG === 'de' ? 'de-DE' : 'en-US';
      r.onresult = function (e) { S.t[i].n = (S.t[i].n ? S.t[i].n + ' ' : '') + e.results[0][0].transcript; save(); render(); };
      r.onerror = function () { tst('Dictée impossible'); };
      r.start(); tst('Parlez maintenant…');
    };

    /* ---------- 2) dictionary: [French, Deutsch, English] ---------- */
    var T = [
      ["Accueil", "Startseite", "Home"],
      ["Rapports", "Berichte", "Reports"],
      ["Compte", "Konto", "Account"],
      ["Jours de mission", "Einsatztage", "Mission days"],
      ["Heures de la semaine", "Wochenstunden", "Hours this week"],
      ["État des tâches", "Aufgabenstatus", "Task status"],
      ["Travail aujourd'hui", "Heute gearbeitet", "Worked today"],
      ["Recherche et filtres", "Suche und Filter", "Search and filters"],
      ["Zone sensible", "Sensibler Bereich", "Danger zone"],
      ["Mission", "Einsatz", "Mission"],
      ["Missions", "Einsätze", "Missions"],
      ["Pointage", "Zeiterfassung", "Time clock"],
      ["Dossier", "Unterlagen", "Records"],
      ["Équipe", "Team", "Team"],
      ["← Équipe", "← Team", "← Team"],
      ["Plus", "Mehr", "More"],
      ["Avancement", "Fortschritt", "Progress"],
      ["Travail", "Arbeit", "Work"],
      ["Heures sup.", "Überstd.", "Overtime"],
      ["Frais TND", "Spesen TND", "Expenses TND"],
      ["À faire", "Offen", "To do"],
      ["En cours", "In Arbeit", "In progress"],
      ["Bloqué", "Blockiert", "Blocked"],
      ["Bloquées", "Blockiert", "Blocked"],
      ["Terminé", "Erledigt", "Done"],
      ["Tout", "Alle", "All"],
      ["Arrivée", "Kommen", "Clock in"],
      ["Départ", "Gehen", "Clock out"],
      ["Pause", "Pause", "Break"],
      ["Début de trajet", "Fahrtbeginn", "Start of trip"],
      ["Fin de trajet", "Fahrtende", "End of trip"],
      ["Reprendre le travail", "Arbeit fortsetzen", "Resume work"],
      ["Début de pause", "Pausenbeginn", "Start of break"],
      ["Fin de pause", "Pausenende", "End of break"],
      ["Chronologie du jour", "Tagesverlauf", "Today's timeline"],
      ["Aujourd'hui", "Heute", "Today"],
      ["Semaine", "Woche", "Week"],
      ["Détail", "Details", "Details"],
      ["Trajet", "Fahrt", "Travel"],
      ["Journal", "Protokoll", "Log"],
      ["Ordres reçus", "Erhaltene Aufträge", "Orders received"],
      ["Frais", "Spesen", "Expenses"],
      ["Incidents", "Vorfälle", "Incidents"],
      ["Nouvel ordre reçu", "Neuer Auftrag", "New order received"],
      ["Nouveau frais", "Neue Ausgabe", "New expense"],
      ["Nouvel incident", "Neuer Vorfall", "New incident"],
      ["Enregistrer", "Speichern", "Save"],
      ["Joindre une photo", "Foto anhängen", "Attach a photo"],
      ["Photo du reçu", "Foto des Belegs", "Photo of receipt"],
      ["Ajouter ma position", "Meinen Standort hinzufügen", "Add my location"],
      ["Total", "Summe", "Total"],
      ["Nouvelle tâche", "Neue Aufgabe", "New task"],
      ["Ajouter", "Hinzufügen", "Add"],
      ["Remarques de l'administration", "Hinweise der Verwaltung", "Notes from administration"],
      ["Rapport du jour", "Tagesbericht", "Daily report"],
      ["Générer le rapport", "Bericht erstellen", "Generate report"],
      ["Rapport mensuel (PDF)", "Monatsbericht (PDF)", "Monthly report (PDF)"],
      ["Générer le PDF", "PDF erstellen", "Generate PDF"],
      ["Inclure les photos", "Fotos einbeziehen", "Include photos"],
      ["Mon profil", "Mein Profil", "My profile"],
      ["Profil", "Profil", "Profile"],
      ["Se déconnecter", "Abmelden", "Sign out"],
      ["Réglages", "Einstellungen", "Settings"],
      ["Heures normales par jour", "Normalarbeitszeit pro Tag", "Regular hours per day"],
      ["Sauvegarde", "Sicherung", "Backup"],
      ["Exporter", "Exportieren", "Export"],
      ["Importer", "Importieren", "Import"],
      ["Réinitialiser", "Zurücksetzen", "Reset"],
      ["Apparence", "Darstellung", "Appearance"],
      ["Thème", "Design", "Theme"],
      ["Sombre", "Dunkel", "Dark"],
      ["Clair", "Hell", "Light"],
      ["Langue", "Sprache", "Language"],
      ["Installer l'application", "App installieren", "Install the app"],
      ["Installer sur l'écran d'accueil", "Zum Home-Bildschirm hinzufügen", "Add to Home Screen"],
      ["Étapes", "Schritte", "Steps"],
      ["Nouvelle étape", "Neuer Schritt", "New step"],
      ["Détecteurs / chambres", "Melder / Zimmer", "Detectors / rooms"],
      ["Jour de la mission", "Einsatztag", "Mission day"],
      ["Ajouter une photo", "Foto hinzufügen", "Add a photo"],
      ["Faire signer le client", "Kunden unterschreiben lassen", "Get client signature"],
      ["Dicter une remarque", "Notiz diktieren", "Dictate a note"],
      ["Rogner", "Zuschneiden", "Crop"],
      ["Pivoter", "Drehen", "Rotate"],
      ["Appliquer", "Anwenden", "Apply"],
      ["Supprimer", "Löschen", "Delete"],
      ["Fermer", "Schließen", "Close"],
      ["Effacer", "Leeren", "Clear"],
      ["Confirmer", "Bestätigen", "Confirm"],
      ["Annuler", "Abbrechen", "Cancel"],
      ["Actualiser", "Aktualisieren", "Refresh"],
      ["Exporter CSV", "CSV exportieren", "Export CSV"],
      ["Nouvelle mission", "Neuer Einsatz", "New mission"],
      ["Titre (ex. Hôtel Meridiana — Djerba)", "Titel (z. B. Hotel Meridiana — Djerba)", "Title (e.g. Hotel Meridiana — Djerba)"],
      ["Lieu / site", "Ort / Standort", "Location / site"],
      ["Une tâche par ligne : client | tâche | résultat attendu | durée", "Eine Aufgabe pro Zeile: Kunde | Aufgabe | erwartetes Ergebnis | Dauer", "One task per line: client | task | expected result | duration"],
      ["Créer et envoyer", "Erstellen und senden", "Create and send"],
      ["Employés assignés", "Zugewiesene Mitarbeiter", "Assigned employees"],
      ["Heures — 7 derniers jours", "Stunden – letzte 7 Tage", "Hours – last 7 days"],
      ["Tâches par état", "Aufgaben nach Status", "Tasks by status"],
      ["Au travail", "Bei der Arbeit", "At work"],
      ["Hors service", "Außer Dienst", "Off duty"],
      ["En pause", "In Pause", "On break"],
      ["En trajet", "Unterwegs", "Traveling"],
      ["Heures auj.", "Std. heute", "Hours today"],
      ["Connexion", "Anmeldung", "Sign in"],
      ["Créer un compte", "Konto erstellen", "Create account"],
      ["Mot de passe oublié ?", "Passwort vergessen?", "Forgot password?"],
      ["Nouveau mot de passe", "Neues Passwort", "New password"],
      ["Départ non pointé", "Gehen nicht erfasst", "Clock-out missing"],
      ["Régulariser le départ", "Gehen nachtragen", "Fix clock-out"],
      ["Contact", "Kontakt", "Contact"],
      ["Compte de l'entreprise", "Firmenkonto", "Company account"],
      ["Prénom", "Vorname", "First name"],
      ["Nom de famille", "Nachname", "Last name"],
      ["Téléphone", "Telefon", "Phone"],
      ["Email personnel", "Private E-Mail", "Personal email"],
      ["Email", "E-Mail", "Email"],
      ["Client", "Kunde", "Client"],
      ["Tâche", "Aufgabe", "Task"],
      ["Résultat attendu", "Erwartetes Ergebnis", "Expected result"],
      ["Durée estimée (ex. 3 H)", "Geschätzte Dauer (z. B. 3 H)", "Estimated duration (e.g. 3 H)"],
      ["Chambre", "Zimmer", "Room"],
      ["ID détecteur", "Melder-ID", "Detector ID"],
      ["Rechercher une tâche…", "Aufgabe suchen…", "Search a task…"],
      ["Remarques sur cette tâche…", "Notizen zu dieser Aufgabe…", "Notes on this task…"],
      ["Mot de passe (6 caractères min.)", "Passwort (mind. 6 Zeichen)", "Password (min. 6 characters)"],
      ["Nom complet (pour créer un compte)", "Vollständiger Name (für neues Konto)", "Full name (to create an account)"],
      ["Que demande-t-on ?", "Was wird verlangt?", "What is being asked?"],
      ["De la part de (nom)", "Von (Name)", "From (name)"],
      ["Montant (TND)", "Betrag (TND)", "Amount (TND)"],
      ["Détail", "Details", "Details"],
      ["Que s'est-il passé ?", "Was ist passiert?", "What happened?"],
      ["Nom du client / responsable", "Name des Kunden / Verantwortlichen", "Client / manager name"],
      ["Journal en lecture seule : chaque action est enregistrée avec sa date et son heure.", "Schreibgeschütztes Protokoll: Jede Aktion wird mit Datum und Uhrzeit gespeichert.", "Read-only log: every action is recorded with its date and time."],
      ["Aucune tâche pour le moment. Les missions envoyées par le responsable apparaîtront ici.", "Derzeit keine Aufgaben. Vom Verantwortlichen gesendete Einsätze erscheinen hier.", "No tasks yet. Missions sent by the manager will appear here."],
      ["Touchez la photo pour la changer.", "Tippen Sie auf das Foto, um es zu ändern.", "Tap the photo to change it."],
      ["Efface uniquement les données de cet appareil. Le serveur garde les preuves.", "Löscht nur die Daten auf diesem Gerät. Der Server behält die Nachweise.", "Clears data on this device only. The server keeps the evidence."],
      ["Les données exportées apparaissent ici", "Exportierte Daten erscheinen hier", "Exported data appears here"],
      ["Collez ici une sauvegarde à importer", "Hier eine Sicherung zum Importieren einfügen", "Paste a backup to import here"],
      ["Dans Safari : touchez le bouton Partager, puis « Sur l'écran d'accueil ».", "Tippen Sie in Safari auf „Teilen“ und dann auf „Zum Home-Bildschirm“.", "In Safari: tap Share, then “Add to Home Screen”."],
      ["Dans le menu du navigateur, choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».", "Wählen Sie im Browsermenü „App installieren“ oder „Zum Startbildschirm hinzufügen“.", "In the browser menu, choose “Install app” or “Add to Home Screen”."],
      ["Aucune entrée.", "Keine Einträge.", "No entries."],
      ["Aucun pointage aujourd'hui.", "Heute keine Zeiterfassung.", "No time entries today."],
      ["Aucune donnée pour le moment.", "Noch keine Daten.", "No data yet."],
      ["Chargement…", "Laden…", "Loading…"],
      ["Hors ligne.", "Offline.", "Offline."],
      ["Responsable", "Verantwortlicher", "Manager"],
      ["Employé", "Mitarbeiter", "Employee"],
      /* options / categories */
      ["Message", "Nachricht", "Message"],
      ["Verbal", "Mündlich", "Verbal"],
      ["Sur place", "Vor Ort", "On site"],
      ["Transport", "Transport", "Transport"],
      ["Repas", "Verpflegung", "Meals"],
      ["Hébergement", "Unterkunft", "Accommodation"],
      ["Matériel", "Material", "Equipment"],
      ["Autre", "Sonstiges", "Other"],
      ["Accident", "Unfall", "Accident"],
      ["Risque de sécurité", "Sicherheitsrisiko", "Safety risk"],
      ["Manque d'équipement", "Fehlende Ausrüstung", "Missing equipment"],
      ["Retard / blocage client", "Verzögerung / Kundenblockade", "Delay / client blockage"],
      /* signature / dialogs */
      ["Le client écrit son nom puis signe dans la zone blanche", "Der Kunde schreibt seinen Namen und unterschreibt im weißen Feld", "The client writes their name, then signs in the white area"],
      ["Écrivez le nom du client.", "Bitte den Namen des Kunden eingeben.", "Enter the client's name."],
      ["Signez dans la zone blanche.", "Bitte im weißen Feld unterschreiben.", "Sign in the white area."],
      ["Glissez le doigt pour choisir la zone", "Bereich mit dem Finger auswählen", "Drag to select the area"],
      ["Confirmer la suppression", "Löschen bestätigen", "Confirm deletion"],
      ["Appuyer encore pour tout effacer", "Erneut tippen, um alles zu löschen", "Tap again to erase everything"],
      ["Appuyer encore pour remplacer les données actuelles", "Erneut tippen, um die aktuellen Daten zu ersetzen", "Tap again to replace current data"],
      ["Supprimer cette fiche ?", "Diesen Eintrag löschen?", "Delete this record?"],
      /* toasts / messages */
      ["Dictée non supportée : utilisez le micro du clavier", "Diktat nicht unterstützt: Mikrofon der Tastatur verwenden", "Dictation not supported: use the keyboard microphone"],
      ["Dictée impossible", "Diktat nicht möglich", "Dictation failed"],
      ["Parlez maintenant…", "Jetzt sprechen…", "Speak now…"],
      ["Heure invalide", "Ungültige Uhrzeit", "Invalid time"],
      ["Départ régularisé", "Gehen nachgetragen", "Clock-out fixed"],
      ["Signature enregistrée", "Unterschrift gespeichert", "Signature saved"],
      ["Ordre enregistré", "Auftrag gespeichert", "Order saved"],
      ["Frais enregistré", "Ausgabe gespeichert", "Expense saved"],
      ["Incident enregistré", "Vorfall gespeichert", "Incident saved"],
      ["Mission envoyée", "Einsatz gesendet", "Mission sent"],
      ["Fiche enregistrée", "Eintrag gespeichert", "Record saved"],
      ["Photo jointe ✓", "Foto angehängt ✓", "Photo attached ✓"],
      ["Enregistré ✓", "Gespeichert ✓", "Saved ✓"],
      ["Photo enregistrée ✓", "Foto gespeichert ✓", "Photo saved ✓"],
      ["Email invalide.", "Ungültige E-Mail.", "Invalid email."],
      ["Le titre est obligatoire.", "Titel ist erforderlich.", "Title is required."],
      ["Entrez votre email.", "Bitte E-Mail eingeben.", "Enter your email."],
      ["Annulé.", "Abgebrochen.", "Cancelled."],
      ["Sauvegarde invalide.", "Ungültige Sicherung.", "Invalid backup."],
      ["Si ce compte existe, un lien vous a été envoyé par email.", "Falls das Konto existiert, wurde ein Link per E-Mail gesendet.", "If this account exists, a link has been sent by email."],
      /* operational modules */
      ["Modules", "Module", "Modules"],
      ["7 modules opérationnels", "7 Betriebsmodule", "7 operational modules"],
      ["Modules opérationnels", "Betriebsmodule", "Operational modules"],
      ["Ces modules partagent les données avec le compte connecté selon les règles d'accès Supabase. Le responsable peut consulter les fiches de l'équipe.", "Diese Module teilen Daten mit dem angemeldeten Konto gemäß den Supabase-Zugriffsregeln. Der Verantwortliche kann die Einträge des Teams einsehen.", "These modules share data with the signed-in account according to Supabase access rules. The manager can view the team's records."],
      ["Maintenance", "Wartung", "Maintenance"],
      ["Matériel & Stock", "Material & Lager", "Equipment & Stock"],
      ["Clients & Sites", "Kunden & Standorte", "Clients & Sites"],
      ["Planning", "Planung", "Planning"],
      ["Véhicules", "Fahrzeuge", "Vehicles"],
      ["Documents & Contrats", "Dokumente & Verträge", "Documents & Contracts"],
      ["Notifications", "Benachrichtigungen", "Notifications"],
      ["Interventions, contrôles et réparations", "Einsätze, Kontrollen und Reparaturen", "Interventions, inspections and repairs"],
      ["Équipements, quantités et mouvements", "Geräte, Mengen und Bewegungen", "Equipment, quantities and movements"],
      ["Clients, adresses et sites d'intervention", "Kunden, Adressen und Einsatzorte", "Clients, addresses and work sites"],
      ["Rendez-vous et interventions planifiées", "Termine und geplante Einsätze", "Appointments and scheduled interventions"],
      ["Véhicules, affectations et suivi", "Fahrzeuge, Zuweisungen und Nachverfolgung", "Vehicles, assignments and tracking"],
      ["Références et échéances des documents", "Dokumentreferenzen und Fristen", "Document references and deadlines"],
      ["Alertes et rappels internes", "Interne Warnungen und Erinnerungen", "Internal alerts and reminders"],
      ["Nom de l'équipement / mouvement", "Name des Geräts / der Bewegung", "Equipment / movement name"],
      ["Nom du client ou du site", "Name des Kunden oder Standorts", "Client or site name"],
      ["Véhicule / immatriculation", "Fahrzeug / Kennzeichen", "Vehicle / plate number"],
      ["Nom du document ou contrat", "Name des Dokuments oder Vertrags", "Document or contract name"],
      ["Titre de l'alerte", "Titel der Warnung", "Alert title"],
      ["Titre", "Titel", "Title"],
      ["Détails, référence, quantité, adresse ou notes", "Details, Referenz, Menge, Adresse oder Notizen", "Details, reference, quantity, address or notes"],
      ["Date", "Datum", "Date"],
      ["État", "Status", "Status"],
      ["Nouveau", "Neu", "New"],
      ["Planifié", "Geplant", "Scheduled"],
      ["Annulé", "Storniert", "Cancelled"],
      ["Attribuer à", "Zuweisen an", "Assign to"],
      ["Changer l'état", "Status ändern", "Change status"],
      ["Sans date", "Ohne Datum", "No date"],
      ["Aucune fiche pour ce module.", "Keine Einträge in diesem Modul.", "No records in this module."],
      ["Connectez-vous pour utiliser les modules.", "Melden Sie sich an, um die Module zu nutzen.", "Sign in to use the modules."]
    ];

    function norm(s) {
      return String(s).replace(/[\u00a0\u202f]/g, ' ').replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
    }
    var D = Object.create(null);
    T.forEach(function (r) { D[norm(r[0])] = r[L]; });

    /* dynamic strings: [regex, deutsch, english] ($1.. = captured groups) */
    var R = [
      [/^Bonjour(.*)$/, 'Hallo$1', 'Hello$1'],
      [/^JOUR (\d+)$/, 'TAG $1', 'DAY $1'],
      [/^(\d+) ouvertes$/, '$1 offen', '$1 open'],
      [/^Détecteurs (\d+\/\d+)$/, 'Melder $1', 'Detectors $1'],
      [/^Attendu : (.*)$/, 'Erwartet: $1', 'Expected: $1'],
      [/^Ch\. (.+?) · ID (.+)$/, 'Zi. $1 · ID $2', 'Rm. $1 · ID $2'],
      [/^Heures sup\. \(> (.+) h\)$/, 'Überstunden (> $1 h)', 'Overtime (> $1 h)'],
      [/^Confirmé par (.+) · (.+)$/, 'Bestätigt von $1 · $2', 'Confirmed by $1 · $2'],
      [/^Connexion : (.+)$/, 'Anmeldung: $1', 'Sign-in: $1'],
      [/^Synchro : (.+)$/, 'Sync: $1', 'Synced: $1'],
      [/^(\d+) bloquée\(s\)$/, '$1 blockiert', '$1 blocked'],
      [/^(\d+) nouvelle\(s\) mission\(s\)$/, '$1 neue Einsätze', '$1 new mission(s)'],
      [/^● synchronisé$/, '● synchronisiert', '● synced'],
      [/^○ hors ligne(.*)$/, '○ offline$1', '○ offline$1']
    ];
    var TEAMW = { 'Travail': ['Arbeit', 'Work'], 'Tâches': ['Aufgaben', 'Tasks'], 'Frais': ['Spesen', 'Expenses'], 'Incidents': ['Vorfälle', 'Incidents'] };

    function tx(s) {
      var k = norm(s), m, i;
      if (!k) return null;
      if (D[k] !== undefined) return D[k];
      for (i = 0; i < R.length; i++) if (R[i][0].test(k)) return k.replace(R[i][0], R[i][L]);
      if ((m = k.match(/^(Tout|À faire|En cours|Bloqué|Terminé) (\d+)$/)) && D[m[1]]) return D[m[1]] + ' ' + m[2];
      if ((m = k.match(/^(.+) — (\d+)$/)) && D[norm(m[1])]) return D[norm(m[1])] + ' — ' + m[2];
      if ((m = k.match(/^(.+) · (Responsable|Employé)$/))) return m[1] + ' · ' + D[m[2]];
      if (/(^|· )(Travail|Tâches|Frais|Incidents) \S/.test(k))
        return k.replace(/(^|· )(Travail|Tâches|Frais|Incidents) /g, function (a, p, w) { return p + TEAMW[w][L - 1] + ' '; });
      return null;
    }

    /* ---------- 3) apply to the DOM ---------- */
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
    function doText(n) {
      var p = n.parentNode, v = n.nodeValue;
      if (!p || SKIP[p.nodeName] || !v || !v.trim()) return;
      var r = tx(v);
      if (r == null || r === v.trim()) return;
      if (p.nodeName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', v.trim()); // keep stored value in French
      n.nodeValue = v.match(/^\s*/)[0] + r + v.match(/\s*$/)[0];
    }
    function doAttrs(e) {
      ['placeholder', 'title', 'aria-label'].forEach(function (a) {
        if (e.hasAttribute && e.hasAttribute(a)) { var r = tx(e.getAttribute(a)); if (r != null) e.setAttribute(a, r); }
      });
    }
    function walk(n) {
      if (n.nodeType === 3) { doText(n); return; }
      if (n.nodeType !== 1 || SKIP[n.nodeName]) return;
      doAttrs(n);
      n.querySelectorAll('[placeholder],[title],[aria-label]').forEach(doAttrs);
      var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), t, list = [];
      while ((t = w.nextNode())) list.push(t);
      list.forEach(doText);
    }
    walk(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(walk); });
    }).observe(document.body, { childList: true, subtree: true });

    /* ---------- 4) toasts, confirm(), dates ---------- */
    var _t = window.tst;
    if (_t) window.tst = function (m) { var r = tx(m); return _t(r != null ? r : m); };
    var _c = window.confirm;
    window.confirm = function (m) { var r = tx(m); return _c.call(window, r != null ? r : m); };

    var LOC = LG === 'de' ? 'de-DE' : 'en-GB';
    ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString'].forEach(function (f) {
      var o = Date.prototype[f];
      Date.prototype[f] = function (l, p) { return o.call(this, l === 'fr-FR' ? LOC : l, p); };
    });
  } catch (e) { /* never break the app */ }
  }

  /* run after the app's own script has executed */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
