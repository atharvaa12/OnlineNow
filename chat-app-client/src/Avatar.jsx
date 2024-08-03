export default function Avatar ({username}){
    return (
        <>
        {username && (
        <div className="w-8 h-8 bg-blue-300 text-center pt-0.5 rounded-full">
            {username[0]}
        </div>)
        }
        </>
    );
}