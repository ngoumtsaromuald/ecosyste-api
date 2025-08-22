"""
Exceptions personnalisées pour le SDK ROMAPI Search
"""


class ROMAPIError(Exception):
    """Exception de base pour toutes les erreurs ROMAPI"""
    
    def __init__(self, message: str, code: str = None, status_code: int = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class ValidationError(ROMAPIError):
    """Erreur de validation des paramètres"""
    
    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_ERROR", status_code=400)


class RateLimitError(ROMAPIError):
    """Erreur de dépassement de limite de taux"""
    
    def __init__(self, message: str, retry_after: int = None):
        super().__init__(message, code="RATE_LIMIT_EXCEEDED", status_code=429)
        self.retry_after = retry_after


class NotFoundError(ROMAPIError):
    """Erreur de ressource non trouvée"""
    
    def __init__(self, message: str):
        super().__init__(message, code="NOT_FOUND", status_code=404)


class ServerError(ROMAPIError):
    """Erreur serveur interne"""
    
    def __init__(self, message: str):
        super().__init__(message, code="SERVER_ERROR", status_code=500)


class AuthenticationError(ROMAPIError):
    """Erreur d'authentification"""
    
    def __init__(self, message: str):
        super().__init__(message, code="AUTHENTICATION_ERROR", status_code=401)


class TimeoutError(ROMAPIError):
    """Erreur de timeout"""
    
    def __init__(self, message: str):
        super().__init__(message, code="TIMEOUT_ERROR")


class NetworkError(ROMAPIError):
    """Erreur réseau"""
    
    def __init__(self, message: str):
        super().__init__(message, code="NETWORK_ERROR")