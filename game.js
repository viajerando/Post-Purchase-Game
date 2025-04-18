// game.js - Versión mejorada
jQuery(document).ready(function($) {
    // Variables para el juego
    let canvas = document.getElementById('game-wheel-canvas');
    let ctx;
    let wheel;
    let canSpin = true;
    let spinAngleStart;
    let spinTime = 0;
    let spinTimeTotal = 0;
    let spinVelocity;
    let currentResult = null;
    
    // Sonidos para el juego
    const sounds = {
        spin: new Howl({ src: [post_purchase_game.sounds_url + 'wheel_spin.mp3'], volume: 0.5 }),
        win: new Howl({ src: [post_purchase_game.sounds_url + 'win.mp3'], volume: 0.6 }),
        lose: new Howl({ src: [post_purchase_game.sounds_url + 'lose.mp3'], volume: 0.6 }),
        repeat: new Howl({ src: [post_purchase_game.sounds_url + 'repeat.mp3'], volume: 0.6 }),
        claim: new Howl({ src: [post_purchase_game.sounds_url + 'claim.mp3'], volume: 0.6 })
    };
    
    // Colores para los 12 segmentos (4 por tipo)
    const segmentColors = {
        advance: ['#4CAF50', '#45a049', '#3d9142', '#357b3b'], // Verdes
        repeat: ['#2196F3', '#1e88e5', '#1976d2', '#1565c0'],  // Azules
        lose: ['#F44336', '#e53935', '#d32f2f', '#c62828']     // Rojos
    };
    
    // Etiquetas para los segmentos
    const segmentLabels = {
        advance: ['Avanzar', 'Avanzar', 'Avanzar', 'Avanzar'],
        repeat: ['Repetir', 'Repetir', 'Repetir', 'Repetir'],
        lose: ['Pierde', 'Pierde', 'Pierde', 'Pierde']
    };
    
    // Crear los 12 segmentos para la ruleta
    const segments = [];
    let segmentIndex = 0;
    
    // Definir el orden específico de los segmentos para evitar agrupaciones predecibles
    const segmentOrder = [
        'advance', 'repeat', 'lose', 'advance',
        'lose', 'repeat', 'advance', 'lose',
        'repeat', 'advance', 'lose', 'repeat'
    ];
    
    // Crear los segmentos basados en el orden definido
    segmentOrder.forEach((type, index) => {
        const colorIndex = index % 4;
        segments.push({
            label: segmentLabels[type][colorIndex],
            color: segmentColors[type][colorIndex],
            value: type,
            index: index
        });
    });
    
    // Tamaño de cada segmento en radianes
    const segmentSize = 2 * Math.PI / segments.length;
    
    // Inicializar la ruleta si está presente el canvas
    if (canvas) {
        ctx = canvas.getContext('2d');
        wheel = createWheel();
        drawWheel();
        
        // Añadir el indicador estático en la parte superior
        drawStaticIndicator();
    }
    
    // Botones de juego
    $('#claim-reward').on('click', function() {
        claimReward();
    });
    
    $('#play-game').on('click', function() {
        $('#initial-options').fadeOut(300, function() {
            $('#game-area').fadeIn(400);
        });
    });
    
    $('#spin-wheel').on('click', function() {
        if (canSpin) {
            spinWheel();
            sounds.spin.play();
        }
    });
    
    $('#continue-playing').on('click', function() {
        $('#game-result').fadeOut(300, function() {
            $('#spin-wheel').fadeIn(400);
            canSpin = true;
        });
    });
    
    $('#take-reward').on('click', function() {
        sounds.claim.play();
        claimReward();
    });
    
    // Función para crear la ruleta
    function createWheel() {
        let wheel = {
            outerRadius: 170,
            innerRadius: 50,
            textRadius: 120,
            centerX: canvas.width / 2,
            centerY: canvas.height / 2,
            numSegments: segments.length,
            segments: segments,
            // Matriz de rotación
            rotationAngle: 0,
            // Controles visuales
            drawText: true,
            textFontSize: 16,
            textFontFamily: "'Montserrat', Arial, sans-serif",
            textFontWeight: 'bold',
            textOrientation: 'horizontal',
            // Funciones de animación
            animation: {
                type: 'spinToStop',
                duration: 5,
                spins: 8,
                easing: 'easeOutCubic'
            }
        };
        
        return wheel;
    }
    
    // Función para dibujar el indicador estático
    function drawStaticIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'wheel-indicator';
        
        // Posicionamiento del indicador
        const wheelContainer = document.querySelector('.game-wheel');
        wheelContainer.appendChild(indicator);
    }
    
    // Función para dibujar la rueda
    function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(wheel.centerX, wheel.centerY);
        ctx.rotate(wheel.rotationAngle);
        
        // Dibujar segmentos
        for (let i = 0; i < wheel.numSegments; i++) {
            const segment = wheel.segments[i];
            const startAngle = i * segmentSize;
            const endAngle = startAngle + segmentSize;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, wheel.outerRadius, startAngle, endAngle);
            ctx.lineTo(0, 0);
            ctx.closePath();
            
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            // Borde del segmento
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            
            ctx.save();
            
            // Dibujar texto
            if (wheel.drawText) {
                ctx.fillStyle = "#ffffff";
                ctx.font = `${wheel.textFontWeight} ${wheel.textFontSize}px ${wheel.textFontFamily}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                // Ajustar el ángulo para posicionar el texto
                const textAngle = startAngle + (segmentSize / 2);
                const textX = wheel.textRadius * Math.cos(textAngle);
                const textY = wheel.textRadius * Math.sin(textAngle);
                
                ctx.translate(textX, textY);
                
                // Rotar el texto para que sea legible
                if (wheel.textOrientation === 'curved') {
                    ctx.rotate(textAngle + Math.PI / 2);
                } else {
                    ctx.rotate(textAngle + Math.PI / 2);
                }
                
                ctx.fillText(segment.label, 0, 0);
            }
            
            ctx.restore();
        }
        
        // Decoraciones adicionales para la rueda
        // Círculo exterior
        ctx.beginPath();
        ctx.arc(0, 0, wheel.outerRadius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Dibujar círculo central
        ctx.beginPath();
        ctx.arc(0, 0, wheel.innerRadius, 0, 2 * Math.PI);
        
        // Gradiente radial para el centro
        const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, wheel.innerRadius);
        innerGradient.addColorStop(0, '#ffffff');
        innerGradient.addColorStop(1, '#e0e0e0');
        
        ctx.fillStyle = innerGradient;
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Añadir decoración al centro
        ctx.beginPath();
        ctx.arc(0, 0, wheel.innerRadius - 10, 0, 2 * Math.PI);
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Función para girar la rueda
    function spinWheel() {
        // Pre-determinar el resultado antes de la animación
        canSpin = false;
        $('#spin-wheel').prop('disabled', true).addClass('disabled');
        
        // Obtener datos necesarios
        const orderId = $('#order-id').val();
        const currentPercentage = $('#current-percentage').val();
        
        // Añadir un efecto de desenfoque durante el giro
        $('.game-wheel').addClass('spinning');
        
        $.ajax({
            url: post_purchase_game.ajax_url,
            type: 'POST',
            data: {
                action: 'play_game',
                nonce: post_purchase_game.nonce,
                order_id: orderId,
                current_percentage: currentPercentage
            },
            success: function(response) {
                if (response.success) {
                    currentResult = response.data;
                    
                    // Encontrar todos los segmentos que coinciden con el resultado
                    const resultSegments = segments.filter(segment => segment.value === response.data.result);
                    
                    // Elegir uno específico basado en segment_index del servidor
                    const serverSegmentIndex = response.data.segment_index;
                    const targetSegment = segments.find(segment => segment.index === serverSegmentIndex) || resultSegments[0];
                    
                    // Calcular el ángulo para que el indicador señale al segmento deseado
                    const targetIndex = segments.indexOf(targetSegment);
                    
                    // La posición inicial del indicador es en la parte superior (3 o'clock position)
                    // El segmento en la parte superior es el que está a 270 grados en el sistema de coordenadas del canvas
                    // Necesitamos girar la rueda para que el segmento objetivo quede en esa posición
                    
                    let targetAngle = (2 * Math.PI) - ((targetIndex * segmentSize) + (segmentSize / 2));
                    targetAngle += Math.PI / 2; // Ajuste para que el indicador apunte a la parte superior
                    
                    // Añadir rotaciones completas para el efecto
                    targetAngle += Math.PI * 2 * (4 + Math.random()); // 4-5 rotaciones completas
                    
                    // Iniciar animación
                    spinTimeTotal = 5000 + Math.random() * 1000; // 5-6 segundos
                    spinAngleStart = wheel.rotationAngle;
                    spinVelocity = targetAngle - spinAngleStart;
                    spinTime = 0;
                    rotateWheel();
                } else {
                    $('.game-wheel').removeClass('spinning');
                    showGameMessage('error', response.data.message);
                    canSpin = true;
                    $('#spin-wheel').prop('disabled', false).removeClass('disabled');
                }
            },
            error: function() {
                $('.game-wheel').removeClass('spinning');
                showGameMessage('error', 'Error en la comunicación con el servidor');
                canSpin = true;
                $('#spin-wheel').prop('disabled', false).removeClass('disabled');
            }
        });
    }
    
    // Función para mostrar mensajes de juego
    function showGameMessage(type, message) {
        const messageElement = $('<div>').addClass('game-message ' + type).text(message);
        $('.game-wheel-container').append(messageElement);
        
        setTimeout(function() {
            messageElement.addClass('show');
            
            setTimeout(function() {
                messageElement.removeClass('show');
                setTimeout(function() {
                    messageElement.remove();
                }, 500);
            }, 3000);
        }, 100);
    }
    
    // Función para animar la rotación con easing
    function rotateWheel() {
        spinTime += 16; // Aproximadamente 60fps
        
        if (spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        
        // Calcular la rotación usando una función de easing
        let progress = spinTime / spinTimeTotal;
        let easeOut = getEasingFunction(wheel.animation.easing);
        let currentAngle = spinAngleStart + (easeOut(progress) * spinVelocity);
        
        wheel.rotationAngle = currentAngle;
        drawWheel();
        
        requestAnimationFrame(rotateWheel);
    }
    
    // Función para obtener la función de easing
    function getEasingFunction(type) {
        const easings = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeOutElastic: t => {
                let p = 0.3;
                return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
            }
        };
        
        return easings[type] || easings.easeOutCubic;
    }
    
    // Función para detener la rotación
    function stopRotateWheel() {
        // Quitar clase de spinning
        $('.game-wheel').removeClass('spinning');
        
        // Normalizar el ángulo entre 0-360
        let degrees = wheel.rotationAngle * 180 / Math.PI;
        degrees = degrees % 360;
        
        // Reproducir sonido según el resultado
        if (currentResult.result === 'advance') {
            sounds.win.play();
        } else if (currentResult.result === 'repeat') {
            sounds.repeat.play();
        } else {
            sounds.lose.play();
        }
        
        // Mostrar el resultado con animación
        $('#spin-wheel').hide();
        
        // Animar entrada del resultado
        $('#result-text').text(currentResult.message);
        $('#game-result').hide().fadeIn(600);
        
        // Actualizar el porcentaje mostrado
        const newPercentage = currentResult.new_percentage;
        $('#current-percentage').val(newPercentage);
        
        // Actualizar los niveles de comisión visual con animación
        updateCommissionLevels(newPercentage);
        
        // Animar el porcentaje actual
        animatePercentageCounter($('#current-percentage-display'), parseInt($('#current-percentage-display').text()), newPercentage);
        
        // Si el usuario perdió todo, deshabilitar el botón continuar
        if (currentResult.result === 'lose') {
            $('#continue-playing').hide();
            $('#take-reward').text('Volver a comprar').addClass('back-to-shop');
        } else {
            $('#continue-playing').show();
            $('#take-reward').text('Tomar mi recompensa').removeClass('back-to-shop');
        }
        
        // Actualizar el contador del juego
        let gameCounter = parseInt(localStorage.getItem('game_counter') || '0');
        localStorage.setItem('game_counter', ++gameCounter);
    }
    
    // Función para animar el contador de porcentaje
    function animatePercentageCounter(element, start, end) {
        let duration = 1500;
        let startTime = null;
        
        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            
            element.text(value + '%');
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.text(end + '%');
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Función para actualizar visualmente los niveles de comisión
    function updateCommissionLevels(currentPercentage) {
        $('.commission-level').removeClass('active previous-level');
        
        let foundActive = false;
        $('.commission-level').each(function() {
            const level = parseInt($(this).text().replace('%', ''));
            
            if (level == currentPercentage) {
                $(this).addClass('active');
                foundActive = true;
            } else if (foundActive) {
                $(this).addClass('next-level');
            } else {
                $(this).addClass('previous-level');
            }
        });
        
        // Actualizar el texto principal con animación
        if (currentPercentage > 0) {
            const orderTotal = parseFloat($('#order-total').val());
            const reward = orderTotal * (currentPercentage / 100);
            
            $('#current-percentage-display').text(currentPercentage);
            
            // Animar el valor del premio
            animateCurrencyCounter($('#reward-amount'), reward);
        } else {
            $('#current-percentage-display').text('0');
            $('#reward-amount').text('$0.00');
        }
    }
    
    // Función para animar contadores de moneda
    function animateCurrencyCounter(element, targetValue) {
        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        });
        
        const startValue = parseFloat(element.text().replace(/[^0-9.-]+/g, '')) || 0;
        const duration = 1500;
        let startTime = null;
        
        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const currentValue = progress * (targetValue - startValue) + startValue;
            
            element.text(formatter.format(currentValue));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.text(formatter.format(targetValue));
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Función para reclamar la recompensa
    function claimReward() {
        const orderId = $('#order-id').val();
        const currentPercentage = $('#current-percentage').val();
        
        // Desactivar botones y mostrar cargando
        $('#claim-reward, #play-game, #take-reward, #continue-playing').prop('disabled', true).addClass('disabled');
        showGameMessage('info', 'Procesando tu recompensa...');
        
        $.ajax({
            url: post_purchase_game.ajax_url,
            type: 'POST',
            data: {
                action: 'claim_reward',
                nonce: post_purchase_game.nonce,
                order_id: orderId,
                current_percentage: currentPercentage
            },
            success: function(response) {
                if (response.success) {
                    // Guardar estadística local
                    const rewardHistory = JSON.parse(localStorage.getItem('reward_history') || '[]');
                    rewardHistory.push({
                        amount: response.data.amount,
                        percentage: currentPercentage,
                        date: new Date().toISOString(),
                        coupon: response.data.coupon_code
                    });
                    localStorage.setItem('reward_history', JSON.stringify(rewardHistory));
                    
                    // Mostrar mensaje de éxito con animación
                    $('.post-purchase-game-container').fadeOut(400, function() {
                        $(this).html(
                            '<div class="reward-success">' +
                            '<div class="success-icon"><i class="fas fa-check-circle"></i></div>' +
                            '<h2>¡Recompensa reclamada!</h2>' +
                            '<p>' + response.data.message + '</p>' +
                            '<div class="coupon-info">' +
                            '<p>Tu código de cupón: <strong>' + response.data.coupon_code + '</strong></p>' +
                            '<p class="coupon-details">Este cupón se aplicará automáticamente en tu próxima compra.</p>' +
                            '</div>' +
                            '<div class="reward-actions">' +
                            '<a href="' + window.location.origin + '/shop" class="button button-primary">Volver a la tienda</a>' +
                            '<a href="' + window.location.origin + '/mi-cuenta/cupones" class="button button-secondary">Ver mis cupones</a>' +
                            '</div>' +
                            '</div>'
                        ).fadeIn(600);
                    });
                    
                    // Confeti para celebrar
                    createConfetti();
                } else {
                    $('#claim-reward, #play-game, #take-reward, #continue-playing').prop('disabled', false).removeClass('disabled');
                    showGameMessage('error', response.data.message);
                }
            },
            error: function() {
                $('#claim-reward, #play-game, #take-reward, #continue-playing').prop('disabled', false).removeClass('disabled');
                showGameMessage('error', 'Error en la comunicación con el servidor');
            }
        });
    }
    
    // Función para crear efecto de confeti
    function createConfetti() {
        const confettiContainer = $('<div>').addClass('confetti-container');
        $('body').append(confettiContainer);
        
        const colors = ['#f44336', '#2196f3', '#ffeb3b', '#4caf50', '#9c27b0'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = $('<div>').addClass('confetti');
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            confetti.css({
                'background-color': color,
                'left': Math.random() * 100 + 'vw',
                'animation-delay': Math.random() * 3 + 's',
                'animation-duration': Math.random() * 2 + 3 + 's'
            });
            
            confettiContainer.append(confetti);
        }
        
        setTimeout(function() {
            confettiContainer.remove();
        }, 6000);
    }
    
    // Inicializar tooltips si existen
    if ($.fn.tooltip) {
        $('.commission-level').tooltip({
            placement: 'top',
            title: function() {
                const level = $(this).text();
                const orderTotal = parseFloat($('#order-total').val());
                const reward = orderTotal * (parseInt(level) / 100);
                return 'Recompensa: ' + reward.toFixed(2);
            }
        });
    }
    
    // Detectar si es un dispositivo móvil para ajustes
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        $('.game-wheel').addClass('mobile');
        wheel.textFontSize = 12; // Texto más pequeño en móviles
        drawWheel(); // Redibujar con los nuevos ajustes
    }
    
    // Manejar redimensión de ventana
    $(window).on('resize', function() {
        if (canvas) {
            // Ajustar tamaño del canvas si es necesario
            const container = $('.game-wheel');
            if (container.width() < 400) {
                canvas.width = container.width();
                canvas.height = canvas.width;
                
                // Ajustar dimensiones de la rueda
                wheel.centerX = canvas.width / 2;
                wheel.centerY = canvas.height / 2;
                wheel.outerRadius = (canvas.width / 2) - 20;
                wheel.textRadius = wheel.outerRadius - 50;
                wheel.innerRadius = wheel.outerRadius / 3.5;
                
                // Redibujar con las nuevas dimensiones
                drawWheel();
            }
        }
    }).trigger('resize');
});
