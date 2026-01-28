**Altair 2.0**

Altair è una web app che permette di accedere a diversi strumenti su rete Multiversx. È una web app modulare suddivisa principalmente in due categorie: explorer e tools.

L'explorer permette di accedere a diversi strumenti per esplorare la rete Multiversx, come la visualizzazione delle transazioni, dei contratti smart, dei token e delle statistiche generali. 

I tools permettono di accedere a diversi strumenti per interagire con la rete Multiversx, come la creazione di transazioni, la gestione dei contratti smartri, la gestione dei token e la gestione delle statistiche generali. Per strutturare insieme questo progetto useremo le API ufficiali di multiversx 

Altairsarà una web app in typescript, react e tailwind ottimizzata per un'esperienza semplice e fluida soprattutto su dispositivi mobili. Glimpse dovrà essere minimal, elegante e moderna. Dovrà offrire una modalità scura di default con la possibilità di cambiarla in modalità light. Si interfaccerà con la rete Multiversx quindi avrà bisogno di utilizzare gli strumenti disponibili su questa rete per funzionare al meglio. Per questo progetto dovrai essere un full stack developer con molteplici anni nello sviluppo su rete Multiversx. Dovrai consigliarmi le migliori procedure per integrare il tutto e soprattutto guidarmi passo dopo passo nella creazione del progetto. Dovrai imparare dai tuoi errori e correggerli e se ci saranno novità durante il percorso, appena ti chiederò qualcosa di attinente dovrai segnalarmele. 

https://gateway.multiversx.com

https://api.multiversx.com

**Tecnologie utilizzate**

- React
- Next.js
- Tailwind CSS
- TypeScript
- Api multiversx
- Lucide React per icone

Se ci sarà bisogno di ulteriori strumenti o tecnologie, li aggiungeremo qui.

**Struttura del progetto**

Il progetto è strutturato come segue:

- una splash page con un logo e un messaggio di benvenuto e un campo di input per inserire un indirizzo ERD o un herotag e un pulsante per iniziare. 3 piccoli bottoni badge: fast execution, user focused, explorer deep dive.
- una dashboard moderna minimale cone le informazioni di base e le statistiche generali. Per questa pagina useremo come riferimento e fonte l'explorer di multiversx unito anche a xspotlight. Come risorsa aggiuntiva puoi utilizzare anche uno strumento che ho realizzato, si chiama poweruser - ti aggiungo anche la repo su github.

https://explorer.multiversx.com/ 
https://xspotlight.com/
https://poweruserx.vercel.app/ 
https://github.com/ilCriptonauta/PowerUser.git

- una pagina di tools dedicati agli snapshot. Per la creazione di questa pagina invece useremo come riferimento un altro tool che ho gia realizzato che si chiama screex. Ti aggiungo la sua URL e la repo su github.

- https://github.com/ilCriptonauta/screexfinal.git 
- https://screex.vercel.app/

l'obbiettivo è di fondere questi due strumenti in un unico strumento che permetta di accedere a tutti i strumenti di multiversx in un unico luogo.  

**Colori che andremo a utilizzare**

Dark theme:
      Primary: "#60A5FA", usage: "CTA, links, accenti principali" },
      secondary: { name: "Secondary", value: "#A78BFA", usage: "Badge, etichette, accenti secondari" },
      accent: { name: "Accent", value: "#22D3EE", usage: "Highlights, notifiche positive" },
      success: { name: "Success", value: "#34D399", usage: "Messaggi di successo, valori positivi" },
      warning: { name: "Warning", value: "#FBBF24", usage: "Alert, attenzione" },
      error: { name: "Error", value: "#F87171", usage: "Errori, valori negativi" },
      background: { name: "Background", value: "#0F172A", usage: "Sfondo principale" },
      surface: { name: "Surface", value: "#1E293B", usage: "Card, contenitori elevati" },
      surfaceHover: { name: "Surface Hover", value: "#334155", usage: "Hover state delle card" },
      border: { name: "Border", value: "#334155", usage: "Bordi, divisori" },
      textPrimary: { name: "Text Primary", value: "#F8FAFC", usage: "Testo principale" },
      textSecondary: { name: "Text Secondary", value: "#94A3B8", usage: "Testo secondario, label" },
      textTertiary: { name: "Text Tertiary", value: "#64748B", usage: "Testo disabilitato, placeholder" 

Light Theme: 

      Primary: { name: "Primary", value: "#3B82F6", usage: "CTA, links, accenti principali" },
      secondary: { name: "Secondary", value: "#8B5CF6", usage: "Badge, etichette, accenti secondari" },
      accent: { name: "Accent", value: "#06B6D4", usage: "Highlights, notifiche positive" },
      success: { name: "Success", value: "#10B981", usage: "Messaggi di successo, valori positivi" },
      warning: { name: "Warning", value: "#F59E0B", usage: "Alert, attenzione" },
      error: { name: "Error", value: "#EF4444", usage: "Errori, valori negativi" },
      background: { name: "Background", value: "#FFFFFF", usage: "Sfondo principale" },
      surface: { name: "Surface", value: "#F8FAFC", usage: "Card, contenitori elevati" },
      surfaceHover: { name: "Surface Hover", value: "#F1F5F9", usage: "Hover state delle card" },
      border: { name: "Border", value: "#E2E8F0", usage: "Bordi, divisori" },
      textPrimary: { name: "Text Primary", value: "#0F172A", usage: "Testo principale" },
      textSecondary: { name: "Text Secondary", value: "#64748B", usage: "Testo secondario, label" },
      textTertiary: { name: "Text Tertiary", value: "#94A3B8", usage: "Testo disabilitato, placeholder"

Il logo dovrà essere unico e moderno e dovrebbe essere facilmente riconoscibile. L'idea è che il logo rappresenti una stella: ✨

**indicazioni sullo sviluppo**

- dovrai utilizzare le API ufficiali di multiversx per accedere ai dati di multiversx.
- se ci sarà bisogno di ulteriori strumenti e tecnologie dovrai suggerirmeli e aggiungerli qui seguendomi passo dopo passo in tutte le inicazioni.
- lavoreremo in italiano ma dovrai sviluppare il progetto in inglese.
- Dovrai fare molta attenzione ai dettagli soprattutto nella creazione della UI e nella creazione del backend.
- Per questo progetto dovrai imparare dai tuoi errori e correggerli e se ci saranno novità durante il percorso, appena ti chiederò qualcosa di attinente dovrai segnalarmele.
- Tutto il progetto dovrà essere modulare e semplice per permettere un facile aggiornamento e aggiunta di nuove funzionalità.
- Ogni qual volta che finirai un processo non avviare il test con il browser ma invitami a testarlo personalmente. 
- Per questo processo dovrai compilare un file readme sia in italiano che in inglese generando istruzioni dettagliate. 
- Per questo processo dovrai compilare un file changelog sia in italiano che in inglese generando istruzioni dettagliate.
- Per questo progetto dovrai creare un piano di lavoro dettagliato e condividerlo con me per approvazione.
- Sarà fondamentale che la splash page abbia solo una visualizzazione con tema scuro e che tutte le altre pagine abbiano la possibilità di eseguire lo switch tra tema scuro e chiaro. Il tema non dovrà influire sulla splash page.

Considera che è il mio primo progetto insieme a te. Sii coerente e cerca di mantenermi aggiornato su tutto il processo. Non avere fretta e non avere fretta di finire il processo. Prenditi il tuo tempo e assicurati di fare un buon lavoro. 

In bocca al lupo per il progetto! 🚀