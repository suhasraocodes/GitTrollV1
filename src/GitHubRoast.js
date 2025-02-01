import React, { useState, useEffect } from "react";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Typewriter } from "react-simple-typewriter";
import { toast } from "sonner"; // Import Sonner

const GitHubRoastUI = () => {
  const [githubUsername, setGithubUsername] = useState("");
  const [otherUsername, setOtherUsername] = useState("");
  const [githubData, setGithubData] = useState(null);
  const [otherUserData, setOtherUserData] = useState(null);
  const [roast, setRoast] = useState("");
  const [loading, setLoading] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const fetchGithubData = async (username) => {
    if (!username) return null;
    try {
      const userResponse = await axios.get(
        `https://api.github.com/users/${username}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_GITHUB_TOKEN}`,
          },
        }
      );
      const reposResponse = await axios.get(
        `https://api.github.com/users/${username}/repos`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_GITHUB_TOKEN}`,
          },
        }
      );
      const starredResponse = await axios.get(
        `https://api.github.com/users/${username}/starred`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_GITHUB_TOKEN}`,
          },
        }
      );

      return {
        ...userResponse.data,
        repos: reposResponse.data,
        starred: starredResponse.data,
      };
    } catch (error) {
      console.error(`Error fetching GitHub data for ${username}:`, error);
      return null;
    }
  };

  useEffect(() => {
    setIsButtonEnabled(
      !!(githubUsername && otherUsername && githubData && otherUserData)
    );
  }, [githubUsername, otherUsername, githubData, otherUserData]);

  const handleFetchData = async () => {
    if (!githubUsername || !otherUsername) {
      toast.error("Both GitHub usernames must be provided!");
      return;
    }

    if (!selectedLanguage) {
      toast.error("Please select a language!");
      return;
    }

    setLoading(true);
    setRoast("");
    const githubUserData = await fetchGithubData(githubUsername);
    const otherUserData = await fetchGithubData(otherUsername);

    if (githubUserData && otherUserData) {
      setGithubData(githubUserData);
      setOtherUserData(otherUserData);
    } else {
      setRoast("Could not fetch data for one or both users. Please try again.");
    }
    setLoading(false);
  };

  const handleRoast = async () => {
    if (!githubData || !otherUserData) return;

    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(
        process.env.REACT_APP_GOOGLE_API_KEY
      );
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Roast these GitHub users based on their profiles in 250 words based on their repo names, starred repos, followers, etc. Use slangs and words in ${selectedLanguage} but letters in English. At the end, compare the first user with the second with the highest humor level:
        1. ${githubData.login}: 
          - ${githubData.public_repos} public repos, ${
        githubData.followers
      } followers, 
          - ${githubData.repos.length} repositories, ${
        githubData.starred.length
      } starred repos.
          - Repositories: ${githubData.repos
            .map((repo) => repo.name)
            .join(", ")}
          - Starred Repos: ${githubData.starred
            .map((repo) => repo.name)
            .join(", ")}

        2. ${otherUserData.login}: 
          - ${otherUserData.public_repos} public repos, ${
        otherUserData.followers
      } followers, 
          - ${otherUserData.repos.length} repositories, ${
        otherUserData.starred.length
      } starred repos.
          - Repositories: ${otherUserData.repos
            .map((repo) => repo.name)
            .join(", ")}
          - Starred Repos: ${otherUserData.starred
            .map((repo) => repo.name)
            .join(", ")}
      `;

      const result = await model.generateContent(prompt);
      setRoast(result.response.text());
    } catch (error) {
      console.error("Error generating roast:", error);
      setRoast("Oops! Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-black text-white p-4">
      <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl text-center border border-gray-700 overflow-y-auto max-h-full">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          GitHub Roast 🔥
        </h1>
  
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="GitHub Username"
            className="p-3 rounded-md border border-gray-600 bg-gray-800 text-white w-full md:w-48 focus:ring-2 focus:ring-white"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
          />
          <span className="text-2xl md:text-3xl font-bold">VS</span>
          <input
            type="text"
            placeholder="Other Username"
            className="p-3 rounded-md border border-gray-600 bg-gray-800 text-white w-full md:w-48 focus:ring-2 focus:ring-white"
            value={otherUsername}
            onChange={(e) => setOtherUsername(e.target.value)}
          />
        </div>
  
        <div className="mt-4">
          <label htmlFor="language" className="text-white text-lg mb-2 block">
            Select a language to get roasted
          </label>
          <select
            id="language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="p-3 rounded-md border border-gray-600 bg-gray-800 text-white w-full md:w-48"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Kannada">Kannada</option>
          </select>
        </div>
  
        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4 mt-6">
          <button
            onClick={handleFetchData}
            className="bg-white text-black px-5 py-3 rounded-md shadow-md hover:bg-gray-200 transition-all transform hover:scale-105 w-full md:w-auto"
          >
            Fetch Data
          </button>
          <button
            onClick={handleRoast}
            className={`bg-red-500 text-white px-5 py-3 rounded-md shadow-md hover:bg-red-400 transition-all transform hover:scale-105 w-full md:w-auto ${
              !isButtonEnabled && "opacity-50 cursor-not-allowed"
            }`}
            disabled={!isButtonEnabled}
          >
            Roast Me! 🔥
          </button>
        </div>
  
        {loading && <div className="mt-4 text-gray-400">Loading...</div>}
  
        {githubData && otherUserData && !loading && (
          <div className="flex flex-col md:flex-row mt-6 space-y-6 md:space-y-0 md:space-x-12 justify-center items-center">
            <div className="flex flex-col items-center">
              <img
                src={githubData.avatar_url}
                alt="Avatar"
                className="w-24 md:w-32 h-24 md:h-32 rounded-full mb-2 border-4 border-white shadow-lg"
              />
              <p className="text-lg font-semibold">{githubData.login}</p>
              <p className="text-gray-400 text-sm md:text-base">
                {githubData.public_repos} repos, {githubData.followers}{" "}
                followers
              </p>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white">VS</div>
            <div className="flex flex-col items-center">
              <img
                src={otherUserData.avatar_url}
                alt="Avatar"
                className="w-24 md:w-32 h-24 md:h-32 rounded-full mb-2 border-4 border-white shadow-lg"
              />
              <p className="text-lg font-semibold">{otherUserData.login}</p>
              <p className="text-gray-400 text-sm md:text-base">
                {otherUserData.public_repos} repos, {otherUserData.followers}{" "}
                followers
              </p>
            </div>
          </div>
        )}
  
        {roast && !loading && (
          <div className="mt-8 text-lg md:text-xl font-semibold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.7)] max-h-[250px] overflow-y-auto p-2 border border-gray-600 rounded-md bg-gray-800 scrollbar-thin scrollbar-thumb-gray-600">
            <Typewriter
              words={[roast]}
              loop={1}
              typeSpeed={50}
              cursor
              cursorStyle="|"
            />
          </div>
        )}
      </div>
    </div>
  );
  
};
export default GitHubRoastUI;
