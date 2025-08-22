"""
Setup configuration for the ROMAPI Search SDK Python package
"""

from setuptools import setup, find_packages
import os

# Read the README file
def read_readme():
    with open("README.md", "r", encoding="utf-8") as fh:
        return fh.read()

# Read requirements
def read_requirements():
    with open("requirements.txt", "r", encoding="utf-8") as fh:
        return [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="romapi-search-sdk",
    version="1.0.0",
    author="ROMAPI Team",
    author_email="dev@romapi.com",
    description="SDK Python officiel pour l'API de recherche ROMAPI",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/romapi/search-sdk-python",
    project_urls={
        "Bug Tracker": "https://github.com/romapi/search-sdk-python/issues",
        "Documentation": "https://docs.romapi.com/sdk/python",
        "Source Code": "https://github.com/romapi/search-sdk-python",
    },
    packages=find_packages(exclude=["tests*"]),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Internet :: WWW/HTTP :: Dynamic Content",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Text Processing :: Indexing",
    ],
    python_requires=">=3.8",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "sphinx>=6.0.0",
            "sphinx-rtd-theme>=1.2.0",
        ],
        "async": [
            "aiohttp>=3.8.0",
        ],
    },
    keywords=[
        "romapi", "search", "api", "cameroon", "sdk", 
        "elasticsearch", "autocomplete", "geosearch"
    ],
    include_package_data=True,
    zip_safe=False,
)