<?php

namespace Database\Seeders;

use App\Models\NotificationTemplate;
use App\Models\NotificationTemplateLang;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        $langCodes = collect($languages)->pluck('code')->toArray();

        $templates = [
            // Lead Create
            [
                'name' => 'Lead Create',
                'translations' => [
                    'en' => [
                        'title' => 'New Lead Create',
                        'notification_template_content' => 'Hello {lead_name}, thank you for showing interest in {organization_name}.Our team will contact you shortly to assist with your needs. - {organization_name}'
                    ],
                    'es' => [
                        'title' => 'Nuevo Lead Creado',
                        'notification_template_content' => 'Hola {lead_name}, gracias por mostrar interés en {organization_name}. Nuestro equipo se pondrá en contacto contigo pronto para ayudarte con tus necesidades. - {organization_name}'
                    ],
                    'ar' => [
                        'title' => 'عميل محتمل جديد',
                        'notification_template_content' => 'مرحبا {lead_name}، شكرا لك لإظهار الاهتمام في {organization_name}. سيتصل بك فريقنا قريبا لمساعدتك في احتياجاتك. - {organization_name}'
                    ],
                    'da' => [
                        'title' => 'Nyt Lead Oprettet',
                        'notification_template_content' => 'Hej {lead_name}, tak for at vise interesse for {organization_name}. Vores team vil kontakte dig snart for at hjælpe med dine behov. - {organization_name}'
                    ],
                    'de' => [
                        'title' => 'Neuer Lead Erstellt',
                        'notification_template_content' => 'Hallo {lead_name}, vielen Dank für Ihr Interesse an {organization_name}. Unser Team wird Sie bald kontaktieren, um Ihnen bei Ihren Bedürfnissen zu helfen. - {organization_name}'
                    ],
                    'fr' => [
                        'title' => 'Nouveau Lead Créé',
                        'notification_template_content' => 'Bonjour {lead_name}, merci de montrer de l\'intérêt pour {organization_name}. Notre équipe vous contactera bientôt pour vous aider avec vos besoins. - {organization_name}'
                    ],
                    'he' => [
                        'title' => 'ליד חדש נוצר',
                        'notification_template_content' => 'שלום {lead_name}, תודה על הענין ב{organization_name}. הצוות שלנו יצור איתך קשר בקרוב כדי לעזור עם הצרכים שלך. - {organization_name}'
                    ],
                    'it' => [
                        'title' => 'Nuovo Lead Creato',
                        'notification_template_content' => 'Ciao {lead_name}, grazie per aver mostrato interesse in {organization_name}. Il nostro team ti contatterà presto per aiutarti con le tue esigenze. - {organization_name}'
                    ],
                    'ja' => [
                        'title' => '新しいリード作成',
                        'notification_template_content' => 'こんにちは{lead_name}、{organization_name}に興味を示していただきありがとうございます。私たちのチームがあなたのニーズをお手伝いするためにすぐにご連絡いたします。 - {organization_name}'
                    ],
                    'nl' => [
                        'title' => 'Nieuwe Lead Aangemaakt',
                        'notification_template_content' => 'Hallo {lead_name}, bedankt voor je interesse in {organization_name}. Ons team zal je binnenkort contacteren om je te helpen met je behoeften. - {organization_name}'
                    ],
                    'pl' => [
                        'title' => 'Nowy Lead Utworzony',
                        'notification_template_content' => 'Cześć {lead_name}, dziękujemy za zainteresowanie {organization_name}. Nasz zespół skontaktuje się z Tobą wkrótce, aby pomóc z Twoimi potrzebami. - {organization_name}'
                    ],
                    'pt' => [
                        'title' => 'Novo Lead Criado',
                        'notification_template_content' => 'Olá {lead_name}, obrigado por mostrar interesse em {organization_name}. Nossa equipe entrará em contato em breve para ajudar com suas necessidades. - {organization_name}'
                    ],
                    'pt-BR' => [
                        'title' => 'Novo Lead Criado',
                        'notification_template_content' => 'Olá {lead_name}, obrigado por mostrar interesse em {organization_name}. Nossa equipe entrará em contato em breve para ajudar com suas necessidades. - {organization_name}'
                    ],
                    'ru' => [
                        'title' => 'Новый Лид Создан',
                        'notification_template_content' => 'Привет {lead_name}, спасибо за интерес к {organization_name}. Наша команда свяжется с вами в ближайшее время, чтобы помочь с вашими потребностями. - {organization_name}'
                    ],
                    'tr' => [
                        'title' => 'Yeni Müşteri Adayı Oluşturuldu',
                        'notification_template_content' => 'Merhaba {lead_name}, {organization_name}\'e ilgi gösterdiğiniz için teşekkürler. Ekibimiz ihtiyaçlarınızla ilgili yardım etmek için yakında sizinle iletişime geçecek. - {organization_name}'
                    ],
                    'zh' => [
                        'title' => '新潜在客户创建',
                        'notification_template_content' => '你好{lead_name}，感谢您对{organization_name}的关注。我们的团队将很快与您联系，协助满足您的需求。 - {organization_name}'
                    ]
                ]
            ],
            // Opportunity create
            [
                'name' => 'Opportunity create',
                'translations' => [
                    'en' => [
                        'title' => 'New opportunity',
                        'notification_template_content' => 'New opportunity: {opportunity_name} worth ${amount}. Account: {account_name}. Close date: {close_date}. Take action now! - {organization_name}'
                    ],
                    'es' => [
                        'title' => 'Nueva oportunidad',
                        'notification_template_content' => 'Nueva oportunidad: {opportunity_name} por valor de ${amount}. Cuenta: {account_name}. Fecha de cierre: {close_date}. ¡Actúa ahora! - {organization_name}'
                    ],
                    'ar' => [
                        'title' => 'فرصة جديدة',
                        'notification_template_content' => 'فرصة جديدة: {opportunity_name} بقيمة ${amount}. الحساب: {account_name}. تاريخ الإغلاق: {close_date}. اتخذ إجراء الآن! - {organization_name}'
                    ],
                    'da' => [
                        'title' => 'Ny mulighed',
                        'notification_template_content' => 'Ny mulighed: {opportunity_name} til værdi af ${amount}. Konto: {account_name}. Lukkedato: {close_date}. Tag handling nu! - {organization_name}'
                    ],
                    'de' => [
                        'title' => 'Neue Gelegenheit',
                        'notification_template_content' => 'Neue Gelegenheit: {opportunity_name} im Wert von ${amount}. Konto: {account_name}. Abschlussdatum: {close_date}. Handeln Sie jetzt! - {organization_name}'
                    ],
                    'fr' => [
                        'title' => 'Nouvelle opportunité',
                        'notification_template_content' => 'Nouvelle opportunité: {opportunity_name} d\'une valeur de ${amount}. Compte: {account_name}. Date de clôture: {close_date}. Agissez maintenant! - {organization_name}'
                    ],
                    'he' => [
                        'title' => 'הזדמנות חדשה',
                        'notification_template_content' => 'הזדמנות חדשה: {opportunity_name} בשווי ${amount}. חשבון: {account_name}. תאריך סגירה: {close_date}. פעל עכשיו! - {organization_name}'
                    ],
                    'it' => [
                        'title' => 'Nuova opportunità',
                        'notification_template_content' => 'Nuova opportunità: {opportunity_name} del valore di ${amount}. Account: {account_name}. Data di chiusura: {close_date}. Agisci ora! - {organization_name}'
                    ],
                    'ja' => [
                        'title' => '新しい機会',
                        'notification_template_content' => '新しい機会: {opportunity_name} 価値${amount}。アカウント: {account_name}。クローズ日: {close_date}。今すぐ行動を！ - {organization_name}'
                    ],
                    'nl' => [
                        'title' => 'Nieuwe kans',
                        'notification_template_content' => 'Nieuwe kans: {opportunity_name} ter waarde van ${amount}. Account: {account_name}. Sluitdatum: {close_date}. Onderneem nu actie! - {organization_name}'
                    ],
                    'pl' => [
                        'title' => 'Nowa szansa',
                        'notification_template_content' => 'Nowa szansa: {opportunity_name} o wartości ${amount}. Konto: {account_name}. Data zamknięcia: {close_date}. Działaj teraz! - {organization_name}'
                    ],
                    'pt' => [
                        'title' => 'Nova oportunidade',
                        'notification_template_content' => 'Nova oportunidade: {opportunity_name} no valor de ${amount}. Conta: {account_name}. Data de fechamento: {close_date}. Aja agora! - {organization_name}'
                    ],
                    'pt-BR' => [
                        'title' => 'Nova oportunidade',
                        'notification_template_content' => 'Nova oportunidade: {opportunity_name} no valor de ${amount}. Conta: {account_name}. Data de fechamento: {close_date}. Aja agora! - {organization_name}'
                    ],
                    'ru' => [
                        'title' => 'Новая возможность',
                        'notification_template_content' => 'Новая возможность: {opportunity_name} стоимостью ${amount}. Аккаунт: {account_name}. Дата закрытия: {close_date}. Действуйте сейчас! - {organization_name}'
                    ],
                    'tr' => [
                        'title' => 'Yeni fırsat',
                        'notification_template_content' => 'Yeni fırsat: {opportunity_name} ${amount} değerinde. Hesap: {account_name}. Kapanış tarihi: {close_date}. Şimdi harekete geç! - {organization_name}'
                    ],
                    'zh' => [
                        'title' => '新机会',
                        'notification_template_content' => '新机会: {opportunity_name} 价值${amount}。账户: {account_name}。关闭日期: {close_date}。立即行动！ - {organization_name}'
                    ]
                ]
            ],
            // Account Create
            [
                'name' => 'Account create',
                'translations' => [
                    'en' => [
                        'title' => 'Welcome to our family',
                        'notification_template_content' => 'Welcome {account_name}! Your account has been created successfully. We are excited to work with you! - {organization_name}'
                    ],
                    'es' => [
                        'title' => 'Bienvenido a nuestra familia',
                        'notification_template_content' => '¡Bienvenido {account_name}! Tu cuenta ha sido creada exitosamente. ¡Estamos emocionados de trabajar contigo! - {organization_name}'
                    ],
                    'ar' => [
                        'title' => 'مرحبا بك في عائلتنا',
                        'notification_template_content' => 'مرحبا {account_name}! تم إنشاء حسابك بنجاح. نحن متحمسون للعمل معك! - {organization_name}'
                    ],
                    'da' => [
                        'title' => 'Velkommen til vores familie',
                        'notification_template_content' => 'Velkommen {account_name}! Din konto er blevet oprettet med succes. Vi er begejstrede for at arbejde med dig! - {organization_name}'
                    ],
                    'de' => [
                        'title' => 'Willkommen in unserer Familie',
                        'notification_template_content' => 'Willkommen {account_name}! Ihr Konto wurde erfolgreich erstellt. Wir freuen uns auf die Zusammenarbeit mit Ihnen! - {organization_name}'
                    ],
                    'fr' => [
                        'title' => 'Bienvenue dans notre famille',
                        'notification_template_content' => 'Bienvenue {account_name}! Votre compte a été créé avec succès. Nous sommes ravis de travailler avec vous! - {organization_name}'
                    ],
                    'he' => [
                        'title' => 'ברוכים הבאים למשפחה שלנו',
                        'notification_template_content' => 'ברוך הבא {account_name}! החשבון שלך נוצר בהצלחה. אנחנו נרגשים לעבוד איתך! - {organization_name}'
                    ],
                    'it' => [
                        'title' => 'Benvenuto nella nostra famiglia',
                        'notification_template_content' => 'Benvenuto {account_name}! Il tuo account è stato creato con successo. Siamo entusiasti di lavorare con te! - {organization_name}'
                    ],
                    'ja' => [
                        'title' => '私たちの家族へようこそ',
                        'notification_template_content' => 'ようこそ{account_name}！あなたのアカウントが正常に作成されました。私たちはあなたと一緒に働くことを楽しみにしています！ - {organization_name}'
                    ],
                    'nl' => [
                        'title' => 'Welkom bij onze familie',
                        'notification_template_content' => 'Welkom {account_name}! Je account is succesvol aangemaakt. We zijn enthousiast om met je te werken! - {organization_name}'
                    ],
                    'pl' => [
                        'title' => 'Witamy w naszej rodzinie',
                        'notification_template_content' => 'Witamy {account_name}! Twoje konto zostało pomyślnie utworzone. Jesteśmy podekscytowani współpracą z Tobą! - {organization_name}'
                    ],
                    'pt' => [
                        'title' => 'Bem-vindo à nossa família',
                        'notification_template_content' => 'Bem-vindo {account_name}! Sua conta foi criada com sucesso. Estamos animados para trabalhar com você! - {organization_name}'
                    ],
                    'pt-BR' => [
                        'title' => 'Bem-vindo à nossa família',
                        'notification_template_content' => 'Bem-vindo {account_name}! Sua conta foi criada com sucesso. Estamos animados para trabalhar com você! - {organization_name}'
                    ],
                    'ru' => [
                        'title' => 'Добро пожаловать в нашу семью',
                        'notification_template_content' => 'Добро пожаловать {account_name}! Ваш аккаунт был успешно создан. Мы рады работать с вами! - {organization_name}'
                    ],
                    'tr' => [
                        'title' => 'Ailemize hoş geldiniz',
                        'notification_template_content' => 'Hoş geldin {account_name}! Hesabın başarıyla oluşturuldu. Seninle çalışmaktan heyecan duyuyoruz! - {organization_name}'
                    ],
                    'zh' => [
                        'title' => '欢迎加入我们的大家庭',
                        'notification_template_content' => '欢迎{account_name}！您的账户已成功创建。我们很高兴与您合作！ - {organization_name}'
                    ]
                ]
            ],
            // Quote Create
            [
                'name' => 'Quote Create',
                'translations' => [
                    'en' => [
                        'title' => 'New Quote Created',
                        'notification_template_content' => 'Quote #{quote_number} created for {account_name}. Amount: ${total_amount}. Valid until {valid_until}. Follow up soon! - {organization_name}'
                    ],
                    'es' => [
                        'title' => 'Nueva Cotización Creada',
                        'notification_template_content' => 'Cotización #{quote_number} creada para {account_name}. Monto: ${total_amount}. Válida hasta {valid_until}. ¡Haz seguimiento pronto! - {organization_name}'
                    ],
                    'ar' => [
                        'title' => 'عرض أسعار جديد',
                        'notification_template_content' => 'عرض أسعار #{quote_number} تم إنشاؤه لـ {account_name}. المبلغ: ${total_amount}. صالح حتى {valid_until}. تابع قريبا! - {organization_name}'
                    ],
                    'da' => [
                        'title' => 'Nyt Tilbud Oprettet',
                        'notification_template_content' => 'Tilbud #{quote_number} oprettet for {account_name}. Beløb: ${total_amount}. Gyldig indtil {valid_until}. Følg op snart! - {organization_name}'
                    ],
                    'de' => [
                        'title' => 'Neues Angebot Erstellt',
                        'notification_template_content' => 'Angebot #{quote_number} für {account_name} erstellt. Betrag: ${total_amount}. Gültig bis {valid_until}. Bald nachfassen! - {organization_name}'
                    ],
                    'fr' => [
                        'title' => 'Nouveau Devis Créé',
                        'notification_template_content' => 'Devis #{quote_number} créé pour {account_name}. Montant: ${total_amount}. Valide jusqu\'au {valid_until}. Suivez bientôt! - {organization_name}'
                    ],
                    'he' => [
                        'title' => 'הצעת מחיר חדשה נוצרה',
                        'notification_template_content' => 'הצעת מחיר #{quote_number} נוצרה עבור {account_name}. סכום: ${total_amount}. תקף עד {valid_until}. עקוב בקרוב! - {organization_name}'
                    ],
                    'it' => [
                        'title' => 'Nuovo Preventivo Creato',
                        'notification_template_content' => 'Preventivo #{quote_number} creato per {account_name}. Importo: ${total_amount}. Valido fino al {valid_until}. Segui presto! - {organization_name}'
                    ],
                    'ja' => [
                        'title' => '新しい見積もり作成',
                        'notification_template_content' => '見積もり#{quote_number}が{account_name}用に作成されました。金額: ${total_amount}。{valid_until}まで有効。すぐにフォローアップ！ - {organization_name}'
                    ],
                    'nl' => [
                        'title' => 'Nieuwe Offerte Aangemaakt',
                        'notification_template_content' => 'Offerte #{quote_number} aangemaakt voor {account_name}. Bedrag: ${total_amount}. Geldig tot {valid_until}. Volg snel op! - {organization_name}'
                    ],
                    'pl' => [
                        'title' => 'Nowa Oferta Utworzona',
                        'notification_template_content' => 'Oferta #{quote_number} utworzona dla {account_name}. Kwota: ${total_amount}. Ważna do {valid_until}. Śledź wkrótce! - {organization_name}'
                    ],
                    'pt' => [
                        'title' => 'Nova Cotação Criada',
                        'notification_template_content' => 'Cotação #{quote_number} criada para {account_name}. Valor: ${total_amount}. Válida até {valid_until}. Acompanhe em breve! - {organization_name}'
                    ],
                    'pt-BR' => [
                        'title' => 'Nova Cotação Criada',
                        'notification_template_content' => 'Cotação #{quote_number} criada para {account_name}. Valor: ${total_amount}. Válida até {valid_until}. Acompanhe em breve! - {organization_name}'
                    ],
                    'ru' => [
                        'title' => 'Новое Предложение Создано',
                        'notification_template_content' => 'Предложение #{quote_number} создано для {account_name}. Сумма: ${total_amount}. Действительно до {valid_until}. Следите скоро! - {organization_name}'
                    ],
                    'tr' => [
                        'title' => 'Yeni Teklif Oluşturuldu',
                        'notification_template_content' => 'Teklif #{quote_number} {account_name} için oluşturuldu. Tutar: ${total_amount}. {valid_until} tarihine kadar geçerli. Yakında takip et! - {organization_name}'
                    ],
                    'zh' => [
                        'title' => '新报价创建',
                        'notification_template_content' => '为{account_name}创建报价#{quote_number}。金额: ${total_amount}。有效期至{valid_until}。尽快跟进！ - {organization_name}'
                    ]
                ]
            ],
            // Case Create
            [
                'name' => 'Case Create',
                'translations' => [
                    'en' => [
                        'title' => 'Case Received',
                        'notification_template_content' => 'Your case is received. Thank you! We will resolve it soon. Case: {case_subject} - {organization_name}'
                    ],
                    'es' => [
                        'title' => 'Caso Recibido',
                        'notification_template_content' => 'Tu caso ha sido recibido. ¡Gracias! Lo resolveremos pronto. Caso: {case_subject} - {organization_name}'
                    ],
                    'ar' => [
                        'title' => 'تم استلام الحالة',
                        'notification_template_content' => 'تم استلام حالتك. شكرا لك! سنحلها قريبا. الحالة: {case_subject} - {organization_name}'
                    ],
                    'da' => [
                        'title' => 'Sag Modtaget',
                        'notification_template_content' => 'Din sag er modtaget. Tak! Vi vil løse det snart. Sag: {case_subject} - {organization_name}'
                    ],
                    'de' => [
                        'title' => 'Fall Erhalten',
                        'notification_template_content' => 'Ihr Fall wurde erhalten. Danke! Wir werden es bald lösen. Fall: {case_subject} - {organization_name}'
                    ],
                    'fr' => [
                        'title' => 'Cas Reçu',
                        'notification_template_content' => 'Votre cas est reçu. Merci! Nous le résoudrons bientôt. Cas: {case_subject} - {organization_name}'
                    ],
                    'he' => [
                        'title' => 'המקרה התקבל',
                        'notification_template_content' => 'המקרה שלך התקבל. תודה! אנחנו נפתור את זה בקרוב. מקרה: {case_subject} - {organization_name}'
                    ],
                    'it' => [
                        'title' => 'Caso Ricevuto',
                        'notification_template_content' => 'Il tuo caso è stato ricevuto. Grazie! Lo risolveremo presto. Caso: {case_subject} - {organization_name}'
                    ],
                    'ja' => [
                        'title' => 'ケース受信',
                        'notification_template_content' => 'あなたのケースを受信しました。ありがとうございます！すぐに解決します。ケース: {case_subject} - {organization_name}'
                    ],
                    'nl' => [
                        'title' => 'Case Ontvangen',
                        'notification_template_content' => 'Je case is ontvangen. Dank je! We zullen het binnenkort oplossen. Case: {case_subject} - {organization_name}'
                    ],
                    'pl' => [
                        'title' => 'Sprawa Otrzymana',
                        'notification_template_content' => 'Twoja sprawa została otrzymana. Dziękujemy! Rozwiążemy to wkrótce. Sprawa: {case_subject} - {organization_name}'
                    ],
                    'pt' => [
                        'title' => 'Caso Recebido',
                        'notification_template_content' => 'Seu caso foi recebido. Obrigado! Resolveremos em breve. Caso: {case_subject} - {organization_name}'
                    ],
                    'pt-BR' => [
                        'title' => 'Caso Recebido',
                        'notification_template_content' => 'Seu caso foi recebido. Obrigado! Resolveremos em breve. Caso: {case_subject} - {organization_name}'
                    ],
                    'ru' => [
                        'title' => 'Обращение Получено',
                        'notification_template_content' => 'Ваше обращение получено. Спасибо! Мы решим это в ближайшее время. Обращение: {case_subject} - {organization_name}'
                    ],
                    'tr' => [
                        'title' => 'Vaka Alındı',
                        'notification_template_content' => 'Vakanız alındı. Teşekkürler! Yakında çözeceğiz. Vaka: {case_subject} - {organization_name}'
                    ],
                    'zh' => [
                        'title' => '案例已收到',
                        'notification_template_content' => '您的案例已收到。谢谢！我们将很快解决。案例: {case_subject} - {organization_name}'
                    ]
                ]
            ],
            // Meeting Create
            [
                'name' => 'Meeting Create',
                'translations' => [
                    'en' => [
                        'title' => 'New Meeting Scheduled',
                        'notification_template_content' => 'Meeting scheduled: {meeting_subject} on {meeting_date} at {meeting_time}. Total Attendees: {attendee_count}. Be prepared! - {organization_name}'
                    ],
                    'es' => [
                        'title' => 'Nueva Reunión Programada',
                        'notification_template_content' => 'Reunión programada: {meeting_subject} el {meeting_date} a las {meeting_time}. Total de Asistentes: {attendee_count}. ¡Prepárate! - {organization_name}'
                    ],
                    'ar' => [
                        'title' => 'اجتماع جديد مجدول',
                        'notification_template_content' => 'اجتماع مجدول: {meeting_subject} في {meeting_date} في {meeting_time}. إجمالي الحضور: {attendee_count}. كن مستعدا! - {organization_name}'
                    ],
                    'da' => [
                        'title' => 'Nyt Møde Planlagt',
                        'notification_template_content' => 'Møde planlagt: {meeting_subject} den {meeting_date} kl. {meeting_time}. Samlede deltagere: {attendee_count}. Vær forberedt! - {organization_name}'
                    ],
                    'de' => [
                        'title' => 'Neues Meeting Geplant',
                        'notification_template_content' => 'Meeting geplant: {meeting_subject} am {meeting_date} um {meeting_time}. Gesamte Teilnehmer: {attendee_count}. Seien Sie vorbereitet! - {organization_name}'
                    ],
                    'fr' => [
                        'title' => 'Nouvelle Réunion Programmée',
                        'notification_template_content' => 'Réunion programmée: {meeting_subject} le {meeting_date} à {meeting_time}. Total des participants: {attendee_count}. Soyez prêt! - {organization_name}'
                    ],
                    'he' => [
                        'title' => 'פגישה חדשה נקבעה',
                        'notification_template_content' => 'פגישה נקבעה: {meeting_subject} ב{meeting_date} ב{meeting_time}. סך המשתתפים: {attendee_count}. היו מוכנים! - {organization_name}'
                    ],
                    'it' => [
                        'title' => 'Nuovo Meeting Programmato',
                        'notification_template_content' => 'Meeting programmato: {meeting_subject} il {meeting_date} alle {meeting_time}. Totale partecipanti: {attendee_count}. Preparatevi! - {organization_name}'
                    ],
                    'ja' => [
                        'title' => '新しい会議がスケジュール',
                        'notification_template_content' => '会議がスケジュールされました: {meeting_subject} {meeting_date} {meeting_time}。参加者総数: {attendee_count}。準備してください！ - {organization_name}'
                    ],
                    'nl' => [
                        'title' => 'Nieuwe Vergadering Gepland',
                        'notification_template_content' => 'Vergadering gepland: {meeting_subject} op {meeting_date} om {meeting_time}. Totaal deelnemers: {attendee_count}. Wees voorbereid! - {organization_name}'
                    ],
                    'pl' => [
                        'title' => 'Nowe Spotkanie Zaplanowane',
                        'notification_template_content' => 'Spotkanie zaplanowane: {meeting_subject} dnia {meeting_date} o {meeting_time}. Łączna liczba uczestników: {attendee_count}. Bądź przygotowany! - {organization_name}'
                    ],
                    'pt' => [
                        'title' => 'Nova Reunião Agendada',
                        'notification_template_content' => 'Reunião agendada: {meeting_subject} em {meeting_date} às {meeting_time}. Total de Participantes: {attendee_count}. Esteja preparado! - {organization_name}'
                    ],
                    'pt-BR' => [
                        'title' => 'Nova Reunião Agendada',
                        'notification_template_content' => 'Reunião agendada: {meeting_subject} em {meeting_date} às {meeting_time}. Total de Participantes: {attendee_count}. Esteja preparado! - {organization_name}'
                    ],
                    'ru' => [
                        'title' => 'Новая Встреча Запланирована',
                        'notification_template_content' => 'Встреча запланирована: {meeting_subject} {meeting_date} в {meeting_time}. Всего участников: {attendee_count}. Будьте готовы! - {organization_name}'
                    ],
                    'tr' => [
                        'title' => 'Yeni Toplantı Planlandı',
                        'notification_template_content' => 'Toplantı planlandı: {meeting_subject} {meeting_date} tarihinde {meeting_time} saatinde. Toplam Katılımcı: {attendee_count}. Hazır olun! - {organization_name}'
                    ],
                    'zh' => [
                        'title' => '新会议已安排',
                        'notification_template_content' => '会议已安排: {meeting_subject} 于{meeting_date} {meeting_time}。参与者总数: {attendee_count}。请做好准备！ - {organization_name}'
                    ]
                ]
            ],
        ];

        // Get all organizations
        $organizations = \App\Models\User::where('type', 'organization')->get();
        function addNotificationTemplates($templates, $organizations, $langCodes, $notificationType)
        {
            foreach ($templates as $templateData) {
                // Create global template (once)
                $template = NotificationTemplate::firstOrCreate(
                    [
                        'name' => $templateData['name'],
                        'type' => $notificationType
                    ]
                );

                // Create content for each organization
                foreach ($organizations as $organization) {
                    foreach ($langCodes as $langCode) {
                        $existingContent = NotificationTemplateLang::where('parent_id', $template->id)
                            ->where('lang', $langCode)
                            ->where('created_by', $organization->id)
                            ->first();

                        if ($existingContent) {
                            continue;
                        }

                        $translation = $templateData['translations'][$langCode] ?? $templateData['translations']['en'];

                        NotificationTemplateLang::create([
                            'parent_id' => $template->id,
                            'lang' => $langCode,
                            'title' => $translation['title'],
                            'notification_template_content' => $translation['notification_template_content'],
                            'created_by' => $organization->id
                        ]);
                    }
                }
                // Create content for global template
                foreach ($langCodes as $langCode) {
                    $existingContent = NotificationTemplateLang::where('parent_id', $template->id)
                        ->where('lang', $langCode)
                        ->where('created_by', 1)
                        ->first();

                    if ($existingContent) {
                        continue;
                    }

                    $translation = $templateData['translations'][$langCode] ?? $templateData['translations']['en'];

                    NotificationTemplateLang::create([
                        'parent_id' => $template->id,
                        'lang' => $langCode,
                        'title' => $translation['title'],
                        'notification_template_content' => $translation['notification_template_content'],
                        'created_by' => 1
                    ]);
                }
            }
        }

        addNotificationTemplates($templates, $organizations, $langCodes, 'twilio');
        addNotificationTemplates($templates, $organizations, $langCodes, 'slack');
    }
}
