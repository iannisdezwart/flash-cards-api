const levenshteinDistance = (str1: string, str2: string) =>
{
	const dp = Array(str2.length + 1)
		.fill(null)
		.map(() => Array(str1.length + 1).fill(null))

	for (let i = 0; i <= str1.length; i++)
	{
		dp[0][i] = i
	}

	for (let j = 0; j <= str2.length; j++)
	{
		dp[j][0] = j
	}

	for (let j = 1; j <= str2.length; j++)
	{
		for (let i = 1; i <= str1.length; i++)
		{
			const cost = str1[i - 1] == str2[j - 1] ? 0 : 1

			dp[j][i] = Math.min(
				dp[j][i - 1] + 1, // Deletion
				dp[j - 1][i] + 1, // Insertion
				dp[j - 1][i - 1] + cost // Substitution
			)

			// Swap

			if (i > 1 && j > 1 && str1[i - 1] == str2[j - 2] && str1[i - 2] == str2[j - 1])
			{
				dp[j][i] = Math.min(dp[j][i], dp[j - 2][i - 2] + cost)
			}
		}
	}

	return dp[str2.length][str1.length]
}

export const answerIsCorrect = (givenAnswer: string, correctAnswer: string) =>
{
	const correctAnswers = correctAnswer.split('/').map(s => s.toLowerCase().trim())
	const givenAnswers = givenAnswer.split('/').map(s => s.toLowerCase().trim())

	for (const givenAnswer of givenAnswers)
	{
		for (const correctAnswer of correctAnswers)
		{
			if (levenshteinDistance(givenAnswer, correctAnswer) <= 2)
			{
				return true
			}
		}
	}

	return false
}