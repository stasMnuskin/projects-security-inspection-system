const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const logger = require('./logger');
const express = require('express');
const path = require('path');

// Only initialize in development
if (process.env.NODE_ENV === 'development') {
    global.receivedEmails = [];
}

const smtpServer = new SMTPServer({
    secure: false,
    authOptional: true,
    disabledCommands: ['STARTTLS'],
    
    onData(stream, session, callback) {
        if (process.env.NODE_ENV !== 'development') {
            callback();
            return;
        }

        simpleParser(stream)
            .then(parsed => {
                const emailData = {
                    id: Date.now(),
                    from: parsed.from?.text,
                    to: parsed.to?.text,
                    subject: parsed.subject,
                    text: parsed.text,
                    date: new Date(),
                    processed: false
                };

                global.receivedEmails.unshift(emailData);
                
                if (global.receivedEmails.length > 100) {
                    global.receivedEmails = global.receivedEmails.slice(0, 100);
                }

                logger.info('📧 Received Email:', {
                    from: emailData.from,
                    to: emailData.to,
                    subject: emailData.subject
                });
            })
            .catch(err => {
                logger.error('Error parsing email:', err);
            })
            .finally(() => {
                callback();
            });
    },

    onAuth(auth, session, callback) {
        callback(null, { user: auth.username });
    }
});

const setupDevMailInterface = (app) => {
    if (process.env.NODE_ENV !== 'development') return;

    app.get('/dev/emails', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>אימיילים בפיתוח</title>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background: #f5f5f5;
                    }
                    .email-list {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .email-item {
                        background: white;
                        border: 1px solid #ddd;
                        margin-bottom: 10px;
                        padding: 15px;
                        border-radius: 4px;
                    }
                    .email-header {
                        margin-bottom: 10px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .email-subject {
                        font-weight: bold;
                        font-size: 1.1em;
                        color: #333;
                    }
                    .email-meta {
                        color: #666;
                        font-size: 0.9em;
                        margin: 5px 0;
                    }
                    .email-content {
                        white-space: pre-wrap;
                        font-family: monospace;
                        background: #f9f9f9;
                        padding: 10px;
                        border-radius: 4px;
                    }
                    h1 {
                        text-align: center;
                        color: #333;
                    }
                    .refresh {
                        display: block;
                        text-align: center;
                        margin: 20px 0;
                        color: #666;
                    }
                </style>
                <script>
                    function refreshPage() {
                        location.reload();
                    }
                    // Auto refresh every 10 seconds
                    setInterval(refreshPage, 10000);
                </script>
            </head>
            <body>
                <div class="email-list">
                    <h1>אימיילים שנשלחו בסביבת פיתוח</h1>
                    <div class="refresh">מתרענן אוטומטית כל 10 שניות</div>
                    ${global.receivedEmails.map(email => `
                        <div class="email-item">
                            <div class="email-header">
                                <div class="email-subject">${email.subject || '(ללא נושא)'}</div>
                                <div class="email-meta">
                                    <div>מאת: ${email.from || 'לא ידוע'}</div>
                                    <div>אל: ${email.to || 'לא ידוע'}</div>
                                    <div>תאריך: ${new Date(email.date).toLocaleString()}</div>
                                    <div>סטטוס: ${email.processed ? 'עובד' : 'ממתין לעיבוד'}</div>
                                </div>
                            </div>
                            <div class="email-content">${email.text || '(ללא תוכן)'}</div>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `);
    });
};

const startDevMailServer = (app) => {
    // Only start in development
    if (process.env.NODE_ENV === 'development') {
        const port = 2525;
        smtpServer.listen(port, () => {
            logger.info(`Development SMTP Server running on port ${port}`);
            logger.info('View emails at: http://localhost:5000/dev/emails');
        });
        setupDevMailInterface(app);
    }
};

module.exports = { startDevMailServer };
