package com.inkaquest.modules.chatbot.dto;

public record EnviarMensajeResponse(ChatbotConversacionResponse conversacion,
                                    ChatbotMensajeResponse mensaje,
                                    ChatbotMensajeResponse respuesta) { }
