
import nodemailer, { Transporter } from 'nodemailer';

import  handlebars from 'handlebars';
import fs from 'fs';

class SendMailService {
    private client: Transporter;
    constructor(){
        nodemailer.createTestAccount().then((accont)=>{
            const transporter = nodemailer.createTransport({
                host: accont.smtp.host,
                port: accont.smtp.port,
                secure: accont.smtp.secure,
                auth: {
                    user: accont.user,
                    pass: accont.pass,
                },
            });
            this.client = transporter;
        });
    }
    async execute(to: string, subject: string, varieables: object, path: string ){
        // lendo o template
        
        const templateFileContent = fs.readFileSync(path).toString('utf8');

       const mailTemplateParse = handlebars.compile(templateFileContent)

       const html = mailTemplateParse(varieables)

        const message = await this.client.sendMail({
            to,
            subject,
            html,
            from: "NPS <noreplay@nps.com.br>",
        });

        console.log("Message send: %s", message.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(message));

    }
}
export default new SendMailService();