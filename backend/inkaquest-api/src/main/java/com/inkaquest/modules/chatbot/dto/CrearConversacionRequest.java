package com.inkaquest.modules.chatbot.dto;

import jakarta.validation.constraints.Size;

public record CrearConversacionRequest(@Size(max = 160) String titulo) { }
