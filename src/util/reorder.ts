export const reorder = <T>(array: T[], oldIndex: number, newIndex: number) =>
{
	const elementsBeforeIndex = array.slice(0, oldIndex)
	const elementsAfterIndex = array.slice(oldIndex + 1)
	const newArray = [ ...elementsBeforeIndex, ...elementsAfterIndex ]

	newArray.splice(newIndex, 0, array[oldIndex])

	return newArray
}