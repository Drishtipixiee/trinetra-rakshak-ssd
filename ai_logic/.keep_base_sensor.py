import cv2
from abc import ABC, abstractmethod

class BaseSensor(ABC):
    """
    Abstract Base Class for all Virtual Sensors in Trinetra Rakshak.
    """
    def __init__(self, name="BaseSensor"):
        self.name = name

    @abstractmethod
    def process_frame(self, frame):
        """
        Process incoming camera frame. Must output localized entities or values.
        """
        pass
