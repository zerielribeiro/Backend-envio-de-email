import { Request, Response} from "express";
import { resolve } from 'path'; 
import { getCustomRepository, RepositoryNotTreeError } from 'typeorm';
import { UserRepository } from '../repositories/UserRespository';
import { SurveysRepository} from '../repositories/SurveyRepository';
import { SurveysUsersRepository} from '../repositories/SurveysUsersRepository';
import SendMailService from "../services/SendMailService";


class SendMailController {
    async execute( request: Request, response: Response){
       const { email, survey_id} = request.body

        const usersRepository = getCustomRepository(UserRepository);
        const surveysRepository = getCustomRepository(SurveysRepository);
        const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

        const user = await usersRepository.findOne({email});

        if(!user) {
            return response.status(400).json({
                error: " User does not exist",
            });
        }
        const survey = await surveysRepository.findOne({id: survey_id})

        if(!survey){
            return response.status(400).json({
                error: " Survey does not exists!"
            });
        }

        
        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");
         

        // bloquear para enviar a mesma pesquisa para o mesmo usuario, se nao tiver ele envia

        const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
            where: {user_id: user.id, value: null},
            relations: ["user", "survey"],
        });
        const varieables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: '',
            link: process.env.URL_MAIL
        }
            if( surveyUserAlreadyExists) {
                varieables.id = surveyUserAlreadyExists.id;
                await SendMailService.execute(email, survey.title, varieables, npsPath );
                return  response.json(surveyUserAlreadyExists)
            }


        // salvar as informaçoes na tabela
        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id,
        });
        

        await surveysUsersRepository.save(surveyUser);

        //enviar email

        varieables.id = surveyUser.id;       
        

        await SendMailService.execute(email, survey.title, varieables, npsPath);

        return response.json(surveyUser);
    }
}

export {SendMailController};